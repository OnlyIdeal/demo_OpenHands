import { expect, test } from "@playwright/test";

const uniqueName = `MVP 验收项目 ${Date.now()}`;

test("登录到 Agent 任务确认的最小闭环", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/邮箱|Email/i).fill(process.env.E2E_EMAIL ?? "admin@example.com");
  await page.getByLabel(/密码|Password/i).fill(process.env.E2E_PASSWORD ?? "admin123");
  await page.getByRole("button", { name: /登录|Sign in/i }).click();
  await expect(page).toHaveURL(/\/$|\/projects/);

  await page.getByRole("link", { name: /项目管理|项目/i }).click();
  await page.getByRole("button", { name: /新建项目|创建项目/i }).click();
  await page.getByLabel(/项目名称|名称/i).fill(uniqueName);
  await page.getByLabel(/项目描述|描述/i).fill("端到端最小闭环验收项目");
  await page.getByLabel(/工作目录|Workspace/i).fill("demo");
  await page.getByRole("button", { name: /确认创建|创建项目|保存/i }).click();
  await expect(page.getByText(uniqueName)).toBeVisible();

  await page.getByRole("button", { name: /新建需求|创建需求/i }).click();
  await page.getByLabel(/需求标题|标题/i).fill("创建一个待办事项页面");
  await page.getByLabel(/产品想法|业务需求|需求描述/i).fill("用户可以创建、完成并查看待办事项。");
  await page.getByRole("button", { name: /提交需求|保存需求|创建需求/i }).click();

  await page.getByRole("button", { name: /AI 生成|生成 PRD|开始生成/i }).click();
  await expect(page.getByText(/PRD|产品需求文档/i).first()).toBeVisible();
  await expect(page.getByText(/技术方案/i).first()).toBeVisible();
  await expect(page.getByText(/任务清单|开发任务/i).first()).toBeVisible();

  await page.getByRole("link", { name: /查看任务|进入任务|任务详情/i }).first().click();
  await page.getByRole("button", { name: /启动 Agent|开始执行|运行任务/i }).click();
  await expect(page.getByText(/等待确认|waiting_confirmation/i)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("[data-testid='run-event'], .run-event")).toHaveCount(6, { timeout: 30_000 });

  await page.getByRole("button", { name: /运行测试|执行测试/i }).click();
  await expect(page.getByText(/测试通过|passed/i)).toBeVisible();
  await page.getByRole("button", { name: /确认完成|验收通过/i }).click();
  await expect(page.getByText(/已完成|completed/i)).toBeVisible();
});
