# v1.0.0 发布清单

更新时间：2026-07-14

| 项目 | 状态 | 证据 |
| --- | --- | --- |
| 正式构建 | 通过 | `npm run build` |
| 自动功能与视觉验收 | 通过 | 98 项单元检查、4 套浏览器项目完整流程、38 项视觉检查；首次施法准备检查连续 3 次通过 |
| 私有参考边界 | 通过 | `npm run assets:private-check` |
| 素材台账 | 通过 | `npm run assets:ledger-check` |
| 首次下载量 ≤15 MiB | 本地与公开网址均通过 | 公开网址 11.17 MiB，本地发布版 11.16 MiB；见 `transfer-size-report.md` |
| WebGPU 三次召唤 | 通过 | 120.04 平均帧；见 `performance-report.md` |
| 强制 WebGL 2 三次召唤 | 通过 | 118.49 平均帧；见 `performance-report.md` |
| 20 次重置 | 通过 | 对象稳定，静置后内存回落 |
| 36 张视觉基准与实际截图 | 通过 | 见 `visual-review-report.md` |
| macOS Chrome | 通过 | 150.0.7871.115 |
| 桌面 Firefox | 通过 | Mozilla Release 152.0.5 |
| Windows Chrome | 通过 | 149.0.7827.201；真实稳定版完整流程 |
| Windows Edge | 通过 | 149.0.4022.98；真实稳定版完整流程 |
| macOS Safari | 通过 | Safari 26.4 全部交互与直接画布可见性通过；角色与灵猫清晰可见，图形错误为 0 |
| 普通设备性能 | 通过 | M1 级测试机：自动 58.04 帧，WebGL 2 兼容档 49.19 帧 |
| 依赖安全核对 | 通过 | 已知漏洞 0 项 |
| 源码包与构建包 | 通过 | 源码包约 124 MB；直接运行包约 5.9 MB |
| 发布包私有扫描与全新重建 | 通过 | 全新安装、重建、静态打开和私有素材扫描全部完成 |
| 公开 Pages 网址 | 通过 | https://qiqiz4512-sketch.github.io/mimimia/；最终发布运行 `29309440614` 成功 |
| 公开网址空缓存回归 | 通过 | Chrome 150 空缓存 11,710,025 字节，所有运行资源返回成功 |
| 公开网址完整流程 | 通过 | 提前松开、蓄满保持、召唤、灵猫跟随、声音、再次施法重置均通过 |
| v1.0.0 Release | 通过 | https://github.com/qiqiz4512-sketch/mimimia/releases/tag/v1.0.0；源码包与网页成品包均已上传并核对校验值 |

未完成项不得标记为通过；近似浏览器结果不替代真实稳定版记录。
