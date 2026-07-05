import { expect, test } from '@playwright/test'

const backendUrl = 'http://127.0.0.1:8000/api'

test('new project starts clean, uploads its own document and generates isolated hypotheses', async ({ page, request }) => {
  test.setTimeout(480_000)
  const stamp = Date.now()
  const projectName = `Чистый проект PGM ${stamp}`
  const fileName = `fresh-pgm-${stamp}.txt`
  const marker = `FRESH_ONLY_${stamp}`
  const fileText = [
    marker,
    'Отвальные хвосты содержат потери никеля и меди в сростках с силикатной матрицей.',
    'Доизмельчение класса +71 мкм и контроль pH могут повысить раскрытие и селективность флотации.',
    'Гипотезу необходимо проверить серией лабораторных опытов с контрольной пробой.',
  ].join(' ')

  const beforeResponse = await request.get(`${backendUrl}/projects`)
  expect(beforeResponse.ok()).toBeTruthy()
  const beforeProjects = await beforeResponse.json() as Array<{ id: string }>
  const beforeIds = new Set(beforeProjects.map((project) => project.id))

  await page.goto('/projects')
  await page.locator('button.create-feature').click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.locator('.overlay__body textarea').fill(projectName)
  await dialog.locator('.overlay__body input:not([type="file"])').fill('Лабораторный протокол проверки извлечения Ni и Cu')
  await dialog.locator('.overlay__footer .button--primary').click()

  await dialog.locator('.overlay__body input:not([type="file"])').fill('Прирост извлечения не менее 2 п.п.')
  await dialog.locator('.overlay__body textarea').fill('Работать только с отвальными хвостами. Не использовать промышленный синтез. Объяснить физико-химический механизм.')
  await dialog.locator('.overlay__footer .button--primary').click()

  await dialog.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: 'text/plain',
    buffer: Buffer.from(fileText, 'utf-8'),
  })
  await expect(dialog).toContainText(fileName)

  await Promise.all([
    page.waitForURL(/\/projects\/[^/]+\/workspace$/),
    dialog.locator('.overlay__footer .button--primary').click(),
  ])
  const projectId = new URL(page.url()).pathname.split('/')[2]
  expect(projectId).toBeTruthy()
  expect(beforeIds.has(projectId)).toBeFalsy()
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible()

  const filesResponse = await request.get(`${backendUrl}/projects/${projectId}/files`)
  expect(filesResponse.ok()).toBeTruthy()
  const files = await filesResponse.json() as Array<{ id: string; project_id: string; name: string }>
  expect(files).toHaveLength(1)
  expect(files[0]).toMatchObject({ project_id: projectId, name: fileName })

  const contentResponse = await request.get(`${backendUrl}/files/${files[0].id}/content`)
  expect(contentResponse.ok()).toBeTruthy()
  expect(await contentResponse.text()).toContain(marker)

  const runResponse = await request.post(`${backendUrl}/projects/${projectId}/runs`, {
    data: { max_finalists: 2, use_llm: true },
  })
  expect(runResponse.ok()).toBeTruthy()
  const run = await runResponse.json() as { id: string }

  let runState: { status: string; error?: string } | undefined
  const deadline = Date.now() + 420_000
  while (Date.now() < deadline) {
    const statusResponse = await request.get(`${backendUrl}/projects/${projectId}/runs/${run.id}`)
    expect(statusResponse.ok()).toBeTruthy()
    runState = await statusResponse.json() as { status: string; error?: string }
    if (runState.status === 'completed' || runState.status === 'failed') break
    await new Promise((resolve) => setTimeout(resolve, 3_000))
  }
  expect(runState?.status, runState?.error).toBe('completed')

  const hypothesesResponse = await request.get(`${backendUrl}/projects/${projectId}/hypotheses`)
  expect(hypothesesResponse.ok()).toBeTruthy()
  const hypotheses = await hypothesesResponse.json() as {
    total: number
    items: Array<{
      project_id: string
      run_id: string
      evidence: Array<{ source_file_id: string; file_name: string }>
    }>
  }
  expect(hypotheses.total).toBeGreaterThan(0)
  for (const hypothesis of hypotheses.items) {
    expect(hypothesis.project_id).toBe(projectId)
    expect(hypothesis.run_id).toBe(run.id)
    expect(hypothesis.evidence.length).toBeGreaterThan(0)
    expect(hypothesis.evidence.every((item) => item.source_file_id === files[0].id && item.file_name === fileName)).toBeTruthy()
  }

  const filesAfterRun = await request.get(`${backendUrl}/projects/${projectId}/files`)
  expect(await filesAfterRun.json()).toHaveLength(1)

  await page.goto(`/projects/${projectId}/hypotheses`)
  await expect(page.locator('.hypothesis-card--hierarchy')).toHaveCount(hypotheses.total)
  await expect(page.locator('.hypothesis-card--hierarchy').first()).toBeVisible()
})
