# P1 需求追踪矩阵

| 需求/链路 | 来源 | 主要 GraphQL operation | 调用端 | P1/P后续验证 |
|---|---|---|---|---|
| 首页 Banner 跳转 | PDF | `GetBanners`、`GetHomeConfig` | Mobile SearchPage | 有效/失效酒店配置快照，P7/P9 E2E |
| 定位、城市、关键词 | PDF | `SearchHotels`、`PoiList` | Mobile SearchPage/ListPage | 无效城市、坐标、关键词组合 |
| 日期、价格、星级和标签筛选 | PDF | `SearchHotels`、`GetFacilitiesForH5`、`GetTagsForH5` | Mobile SearchPage/ListPage | `GetTagsForH5` 当前为已知缺陷 NB-05 |
| 酒店列表与上滑分页 | PDF | `SearchHotels` | Mobile ListPage | 稳定排序、无重复/遗漏 |
| 酒店详情 | PDF | `GetHotelDetail` | Mobile DetailPage | 图片、设施、地址、POI、房型 |
| 最低价日历 | 当前扩展 | `HotelMinPriceCalendar` | Mobile DetailPage/BookingConfirmPage | 默认范围、售罄、跨月/闰日 |
| 用户名登录/注册/恢复 | PDF/扩展 | `Login`、`Register`、`Me` | PC 与 Mobile 登录/注册/鉴权状态 | 三角色与旧 JWT 兼容 |
| 邮箱验证码登录/注册 | 当前扩展 | `SendEmailCode`、`EmailLogin`、`EmailRegister` | PC 与 Mobile | 频率、过期、单次消费、生产禁用 ADMIN |
| 个人资料 | 当前扩展 | `UpdateMe`、`Me` | PC Profile、Mobile ProfilePage | 本人更新与敏感字段保护 |
| 商户酒店列表/详情 | PDF | `MyHotels`、`Hotel` | PC Merchant HotelList/Edit | 归属、状态筛选、分页 |
| 商户录入/编辑/图片 | PDF | `CreateHotel`、`UpdateHotel`、`SetHotelImages` | PC Merchant HotelEdit | 草稿/提交校验和所有权 |
| 商户提交/撤回/申请下线 | PDF/扩展 | `SubmitHotel`、`WithdrawHotel`、`RequestOffline` | PC Merchant HotelList/Edit | P0 状态机全部转换 |
| 房型维护 | PDF/扩展 | `UpsertRoomType`、`UpdateRoomOps`、`DeleteRoomType` | PC RoomManagement/HotelEdit | 归属、价格、库存、开售 |
| 日历运营 | 当前扩展 | `MerchantRoomTypeCalendar`、`BatchSetRoomTypePrice`、`ClearRoomTypePrice`、`BatchSetRoomTypeStock`、`ClearRoomTypeStock` | PC RoomCalendarDrawer | 跨月、清除、权限、边界 |
| 管理员酒店审核 | PDF | `Hotels`、`Hotel`、`Approve`、`Reject`、`Publish`、`Offline`、`Restore` | PC Admin HotelList | 审核记录、原因、非法转换 |
| 审核记录 | 当前扩展 | `AuditRecords` | PC Admin AuditRecords | 操作人、动作、原因、分页 |
| Banner 管理 | 当前扩展 | `AllBannersQuery`、`UpsertBanner`、`SetBannerEnabled`、`DeleteBanner` | PC Admin Banners | 权限和移动端可见性 |
| 设施管理 | 当前扩展 | `Facilities`、`AllFacilities`、`UpsertFacility`、`SetFacilityEnabled`、`DeleteFacility`、`HardDeleteFacility` | PC Admin Facilities/HotelEdit | 引用保护、软/硬删除 |
| 管理仪表盘 | 当前扩展 | `AdminDashboardStats` | PC Admin Dashboard | NB-10 演示收入差异 |
| OSS 上传 | 当前扩展 | `GetOssInfo` | PC OSSImageUpload | 鉴权、HTTPS、最小权限、过期 |
| 创建订单 | 当前扩展 | `CreateOrder` | Mobile BookingConfirmPage | 逐晚价格、幂等、并发库存 |
| 订单列表/详情 | 当前扩展 | `MyOrders`、`OrderDetail` | Mobile OrdersPage/OrderDetailPage | 本人隔离、分页、脱敏 |
| 取消订单 | 当前扩展 | `CancelOrder` | Mobile OrderDetailPage | 状态、所有权、库存回补 |

完整 operation 到源码页面的逐项映射见 `reports/graphql-operations.md`。
