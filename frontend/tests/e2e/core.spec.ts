import { expect, type APIRequestContext, type Page, test } from '@playwright/test'

const backendUrl = 'http://127.0.0.1:8000/api'

async function createProjectWithRun(request: APIRequestContext) {
  test.setTimeout(360_000)
  const name = `E2E хвосты ${Date.now()}`
  const createResponse = await request.post(`${backendUrl}/projects`, {
    multipart: {
      task: name,
      result: 'Проверяемые гипотезы и лабораторный протокол',
      area: 'Обогащение и металлургия',
      success: 'Прирост извлечения не менее 2 п.п.',
      constraints: 'Не использовать промышленный синтез. Обосновывать механизм через факты источников.',
      files: {
        name: 'tailings-evidence.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Хвосты флотации содержат потери Ni и Cu. Крупность P80, pH и расход реагента влияют на извлечение. Доизмельчение и контроль селективности требуют лабораторной проверки.', 'utf-8'),
      },
    },
  })
  expect(createResponse.ok()).toBeTruthy()
  const project = await createResponse.json() as { id: string; name: string }

  const runResponse = await request.post(`${backendUrl}/projects/${project.id}/runs`, {
    data: { max_finalists: 2, use_llm: process.env.NORLAB_E2E_USE_LLM === 'true' },
  })
  expect(runResponse.ok()).toBeTruthy()
  const run = await runResponse.json() as { id: string }

  let runState: { status: string } | undefined
  const deadline = Date.now() + 300_000
  while (Date.now() < deadline) {
    const statusResponse = await request.get(`${backendUrl}/projects/${project.id}/runs/${run.id}`)
    expect(statusResponse.ok()).toBeTruthy()
    runState = await statusResponse.json() as { status: string }
    if (runState.status === 'completed' || runState.status === 'failed') break
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  expect(runState?.status).toBe('completed')
  return project
}

async function switchToEnglish(page: Page) {
  const inlineEnglishButton = page.locator('.language-switch').getByRole('button', { name: 'EN' })
  if (await inlineEnglishButton.isVisible()) {
    await inlineEnglishButton.click()
    return
  }

  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'EN' }).click()
}

test('project to experiment core path', async ({ page, request }) => {
  const project = await createProjectWithRun(request)

  await page.goto(`/projects/${project.id}/workspace`)
  await expect(page.getByRole('heading', { name: project.name })).toBeVisible()
  await page.getByRole('link', { name: 'Исследование' }).click()
  await expect(page.getByRole('heading', { name: 'Исследование идёт' })).toBeVisible()
  await page.getByRole('link', { name: 'Гипотезы' }).click()
  await page.getByRole('button', { name: /Открыть/ }).first().click()
  await expect(page.getByRole('dialog')).toContainText(/hyp_|H-/)
  await page.getByRole('button', { name: 'Собрать эксперимент' }).click()
  await expect(page.getByRole('heading', { name: 'Эксперименты', level: 1 })).toBeVisible()
})

test('language switch keeps route', async ({ page, request }) => {
  const project = await createProjectWithRun(request)

  await page.goto(`/projects/${project.id}/hypotheses`)
  await switchToEnglish(page)
  await expect(page.getByRole('heading', { name: 'Hypothesis portfolio' })).toBeVisible()
  await expect(page).toHaveURL(/hypotheses/)
})
