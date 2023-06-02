# lark-pr-notify-action-飞书PR通知工作流

![build-test](https://github.com/zhecks/lark-pr-notify-action/actions/workflows/test.yml/badge.svg)

## 工作流用途

在提交PR后，通常需要等待工作流执行完成后才能进行合并。如果工作流的执行时间较长，开发者可能会忘记合并PR，这会导致PR合并的推迟并可能因此产生一系列问题。因此，有必要在工作流执行完成后，尽快进行PR的合并。

该工作流支持在其他工作流完成后，通过飞书🤖的webhook推送该事件的消息。

![示例](https://cdn.jsdelivr.net/gh/jiuhuche120/CDN/images/img_v2_effe82ee-35a9-47ee-b961-ffa5e654f00g.jpg)

## 工作流原理

### 如何检查其他工作流

![检查其他工作流](https://cdn.jsdelivr.net/gh/jiuhuche120/CDN/images/img_v2_32fb5b51-212b-4381-a0cd-fd492911453g.jpg)

### 轮训逻辑

1. 若存在未结束的action，则继续轮询下一轮
2. 若出现失败的action，则终止轮询并进行通知
3. 若所有的action都成功，则终止轮训并进行通知

## 参数说明

* **notification_title**: 通知的标题，默认是项目的名称(非必须)

* **token**: github令牌，私有仓库必须，公共仓库也能通过令牌提升api调用次数(非必须)

* **users**: github账户和飞书open_id的映射关系，e.g. Alice|ou_xx,Bob|ou_xx(必须)

* **timeout**: 超时时间，默认是1800s(非必须)

* **interval**: 轮训的间隔，工作流运行较快适当降低间隔，工作流较慢的适当提升间隔，默认15s(非必须)

* **webhook**: 飞书🤖的webhook地址(必须)

* **secret**: 飞书🤖的签名校验(非必需)
