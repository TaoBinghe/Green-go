# 电单车租赁系统接口文档 sprint-2.0

> 说明：
> 
> 1. 本文档仅包含 Sprint 2 中新增或扩展。
> 2. Sprint 1 已有接口请继续参考 `sprint‐01‐后端接口文档.md` 与 `sprint‐01‐API-documentation.md`。
> 3. 除 `/scooter/list`、`/user/register`、`/user/login`、`/admin/login` 外，其余接口默认需要在请求头 `Authorization` 中携带 JWT。
> 4. `/admin/**` 接口除 JWT 外，还要求当前用户角色为 `MANAGER`，否则返回 `"Forbidden: admin only"`。

## 1. 车辆相关接口

### 1.1 获取车辆列表

#### 1.1.1 基本信息

> 请求路径：`/scooter/list`
> 
> 请求方式：`GET`
> 
> 接口描述：获取系统中的车辆列表，返回车辆状态、位置名称与经纬度信息。

#### 1.1.2 请求参数

无

#### 1.1.3 响应数据

响应数据类型：`application/json`

| 名称             | 类型     | 是否必需 | 备注                          |
| -------------- | ------ | ---- | --------------------------- |
| code           | number | 必需   | 响应码：0-成功，1-失败               |
| message        | string | 非必需  | 提示信息                        |
| data           | array  | 非必需  | 车辆列表                        |
| \|-id          | number | 非必需  | 车辆主键 ID                     |
| \|-scooterCode | string | 非必需  | 车辆编号                        |
| \|-status      | string | 非必需  | `AVAILABLE` / `UNAVAILABLE` |
| \|-location    | string | 非必需  | 位置名称                        |
| \|-longitude   | number | 非必需  | 经度                          |
| \|-latitude    | number | 非必需  | 纬度                          |
| \|-createdAt   | string | 非必需  | 创建时间                        |
| \|-updatedAt   | string | 非必需  | 更新时间                        |

响应数据样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": [
        {
            "id": 1,
            "scooterCode": "SC001",
            "status": "AVAILABLE",
            "location": "Campus North Gate",
            "longitude": 113.323912,
            "latitude": 23.097891,
            "createdAt": "2025-03-01T09:00:00",
            "updatedAt": "2025-03-01T09:00:00"
        }
    ]
}
```

## 2. 订单相关接口

### 2.1 修改待激活订单租期

#### 2.1.1 基本信息

> 请求路径：`/booking/modify-period`
> 
> 请求方式：`POST`
> 
> 接口描述：修改当前用户 `PENDING` 状态订单的租期，并同步更新结束时间、价格方案与总费用。

#### 2.1.2 请求参数

请求参数格式：`QueryString`

| 参数名称        | 说明    | 类型     | 是否必需 | 备注                                       |
| ----------- | ----- | ------ | ---- | ---------------------------------------- |
| bookingId   | 订单 ID | number | 是    |                                          |
| hiredPeriod | 租期代码  | string | 是    | `HOUR_1` / `HOUR_4` / `DAY_1` / `WEEK_1` |

请求数据样例：

```shell
bookingId=1&hiredPeriod=DAY_1
```

#### 2.1.3 响应数据

响应数据类型：`application/json`

| 名称               | 类型     | 是否必需 | 备注            |
| ---------------- | ------ | ---- | ------------- |
| code             | number | 必需   | 响应码：0-成功，1-失败 |
| message          | string | 非必需  | 提示信息          |
| data             | object | 非必需  | 更新后的订单        |
| \|-id            | number | 非必需  | 订单 ID         |
| \|-userId        | number | 非必需  | 用户 ID         |
| \|-scooterId     | number | 非必需  | 车辆 ID         |
| \|-pricingPlanId | number | 非必需  | 价格方案 ID       |
| \|-startTime     | string | 非必需  | 开始时间          |
| \|-endTime       | string | 非必需  | 结束时间          |
| \|-totalCost     | number | 非必需  | 总费用           |
| \|-status        | string | 非必需  | 订单状态          |
| \|-createdAt     | string | 非必需  | 创建时间          |
| \|-updatedAt     | string | 非必需  | 更新时间          |

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "id": 1,
        "userId": 5,
        "scooterId": 2,
        "pricingPlanId": 3,
        "startTime": "2025-03-01T10:00:00",
        "endTime": "2025-03-02T10:00:00",
        "totalCost": 30.00,
        "status": "PENDING",
        "createdAt": "2025-03-01T10:00:00",
        "updatedAt": "2025-03-01T10:05:00"
    }
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Only pending bookings can change hire period",
    "data": null
}
```

### 2.2 取消待激活订单

#### 2.2.1 基本信息

> 请求路径：`/booking/cancel`
> 
> 请求方式：`POST`
> 
> 接口描述：取消当前用户的 `PENDING` 状态订单，并释放对应车辆。

#### 2.2.2 请求参数

请求参数格式：`QueryString`

| 参数名称      | 说明    | 类型     | 是否必需 | 备注  |
| --------- | ----- | ------ | ---- | --- |
| bookingId | 订单 ID | number | 是    |     |

请求数据样例：

```shell
bookingId=1
```

#### 2.2.3 响应数据

响应数据类型：`application/json`

响应结构与“修改待激活订单租期”一致，`data` 为取消后的订单对象。

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "id": 1,
        "userId": 5,
        "scooterId": 2,
        "pricingPlanId": 1,
        "startTime": "2025-03-01T10:00:00",
        "endTime": "2025-03-01T11:00:00",
        "totalCost": 15.00,
        "status": "CANCELLED",
        "createdAt": "2025-03-01T10:00:00",
        "updatedAt": "2025-03-01T10:08:00"
    }
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Only pending bookings can be cancelled",
    "data": null
}
```

### 2.3 续租当前订单

#### 2.3.1 基本信息

> 请求路径：`/booking/renew`
> 
> 请求方式：`POST`
> 
> 接口描述：对当前用户 `ACTIVE` 状态订单进行续租，系统会校验延长期是否可用，并更新结束时间与总费用。

#### 2.3.2 请求参数

请求参数格式：`QueryString`

| 参数名称        | 说明    | 类型     | 是否必需 | 备注                                       |
| ----------- | ----- | ------ | ---- | ---------------------------------------- |
| bookingId   | 订单 ID | number | 是    |                                          |
| hiredPeriod | 续租租期  | string | 是    | `HOUR_1` / `HOUR_4` / `DAY_1` / `WEEK_1` |

请求数据样例：

```shell
bookingId=1&hiredPeriod=HOUR_4
```

#### 2.3.3 响应数据

响应数据类型：`application/json`

响应结构与“修改待激活订单租期”一致，`data` 为续租后的订单对象。

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "id": 1,
        "userId": 5,
        "scooterId": 2,
        "pricingPlanId": 2,
        "startTime": "2025-03-01T10:00:00",
        "endTime": "2025-03-01T18:00:00",
        "totalCost": 60.00,
        "status": "ACTIVE",
        "createdAt": "2025-03-01T10:00:00",
        "updatedAt": "2025-03-01T14:00:00"
    }
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Scooter is not available for the extended period",
    "data": null
}
```

### 2.4 结束订单

#### 2.4.1 基本信息

> 请求路径：`/booking/finish`
> 
> 请求方式：`POST`
> 
> 接口描述：结束当前用户的 `ACTIVE` 订单，内部会执行支付，并返回更新后的订单与支付记录。

#### 2.4.2 请求参数

请求参数格式：`QueryString`

| 参数名称      | 说明    | 类型     | 是否必需 | 备注  |
| --------- | ----- | ------ | ---- | --- |
| bookingId | 订单 ID | number | 是    |     |

请求数据样例：

```shell
bookingId=1
```

#### 2.4.3 响应数据

响应数据类型：`application/json`

| 名称                  | 类型     | 是否必需 | 备注                       |
| ------------------- | ------ | ---- | ------------------------ |
| code                | number | 必需   | 响应码：0-成功，1-失败            |
| message             | string | 非必需  | 提示信息                     |
| data                | object | 非必需  | 结束结果                     |
| \|-booking          | object | 非必需  | 更新后的订单                   |
| \|-payment          | object | 非必需  | 支付记录                     |
| \|-\|-id            | number | 非必需  | 主键 ID                    |
| \|-\|-bookingId     | number | 非必需  | 订单 ID                    |
| \|-\|-userId        | number | 非必需  | 用户 ID                    |
| \|-\|-amount        | number | 非必需  | 支付金额                     |
| \|-\|-status        | string | 非必需  | 支付状态                     |
| \|-\|-cardLastFour  | string | 非必需  | 模拟支付卡号后四位，当前实现可能为 `null` |
| \|-\|-transactionId | string | 非必需  | 交易号                      |
| \|-\|-paymentTime   | string | 非必需  | 支付时间                     |

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "booking": {
            "id": 1,
            "userId": 5,
            "scooterId": 2,
            "pricingPlanId": 2,
            "startTime": "2025-03-01T10:00:00",
            "endTime": "2025-03-01T16:35:10",
            "totalCost": 45.00,
            "status": "COMPLETED",
            "createdAt": "2025-03-01T10:00:00",
            "updatedAt": "2025-03-01T16:35:10"
        },
        "payment": {
            "id": 8,
            "bookingId": 1,
            "userId": 5,
            "amount": 45.00,
            "status": "SUCCESS",
            "cardLastFour": null,
            "transactionId": "TXN-1234567890ABCDEF",
            "paymentTime": "2025-03-01T16:35:10"
        }
    }
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Booking status must be ACTIVE",
    "data": null
}
```

### 2.5 兼容接口：切换订单状态

#### 2.5.1 基本信息

> 请求路径：`/booking/status`
> 
> 请求方式：`POST`
> 
> 接口描述：兼容现有前端详情页的旧接口。用于在 `PENDING` 与 `ACTIVE` 之间切换状态，其中前端传入的 `ACTIVATED` 会被后端映射为 `ACTIVE`。

#### 2.5.2 请求参数

请求参数格式：`QueryString`

| 参数名称      | 说明    | 类型     | 是否必需 | 备注                                 |
| --------- | ----- | ------ | ---- | ---------------------------------- |
| bookingId | 订单 ID | number | 是    |                                    |
| status    | 目标状态  | string | 是    | `PENDING` / `ACTIVATED` / `ACTIVE` |

请求数据样例：

```shell
bookingId=1&status=ACTIVATED
```

#### 2.5.3 响应数据

响应数据类型：`application/json`

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": null
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Only active bookings can be switched back to pending",
    "data": null
}
```

## 3. 管理端车辆辅助接口

### 3.1 根据坐标解析位置名称

#### 3.1.1 基本信息

> 请求路径：`/admin/scooter/resolve-location`
> 
> 请求方式：`GET`
> 
> 接口描述：根据经纬度解析位置名称，仅管理员可用。

#### 3.1.2 请求参数

请求参数格式：`QueryString`

| 参数名称      | 说明  | 类型     | 是否必需 | 备注           |
| --------- | --- | ------ | ---- | ------------ |
| longitude | 经度  | number | 是    | `BigDecimal` |
| latitude  | 纬度  | number | 是    | `BigDecimal` |

请求数据样例：

```shell
longitude=113.323912&latitude=23.097891
```

#### 3.1.3 响应数据

响应数据类型：`application/json`

| 名称      | 类型     | 是否必需 | 备注            |
| ------- | ------ | ---- | ------------- |
| code    | number | 必需   | 响应码：0-成功，1-失败 |
| message | string | 非必需  | 提示信息          |
| data    | string | 非必需  | 解析后的地址字符串     |

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": "Campus North Gate"
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Failed to resolve address from coordinates",
    "data": null
}
```

## 4. 管理端定价方案接口

### 4.1 获取定价方案列表

#### 4.1.1 基本信息

> 请求路径：`/admin/pricing-plans`
> 
> 请求方式：`GET`
> 
> 接口描述：获取全部定价方案，仅管理员可用。

#### 4.1.2 请求参数

无

#### 4.1.3 响应数据

响应数据类型：`application/json`

| 名称            | 类型     | 是否必需 | 备注                                       |
| ------------- | ------ | ---- | ---------------------------------------- |
| code          | number | 必需   | 响应码：0-成功，1-失败                            |
| message       | string | 非必需  | 提示信息                                     |
| data          | array  | 非必需  | 定价方案列表                                   |
| \|-id         | number | 非必需  | 方案 ID                                    |
| \|-hirePeriod | string | 非必需  | `HOUR_1` / `HOUR_4` / `DAY_1` / `WEEK_1` |
| \|-price      | number | 非必需  | 价格                                       |
| \|-updatedAt  | string | 非必需  | 更新时间                                     |

响应数据样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": [
        {
            "id": 1,
            "hirePeriod": "HOUR_1",
            "price": 15.00,
            "updatedAt": "2025-03-01T00:00:00"
        }
    ]
}
```

### 4.2 获取单个定价方案

#### 4.2.1 基本信息

> 请求路径：`/admin/pricing-plans/{id}`
> 
> 请求方式：`GET`
> 
> 接口描述：根据 ID 获取定价方案，仅管理员可用。

#### 4.2.2 请求参数

| 参数名称 | 说明    | 类型     | 是否必需 | 备注   |
| ---- | ----- | ------ | ---- | ---- |
| id   | 方案 ID | number | 是    | 路径参数 |

#### 4.2.3 响应数据

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "id": 2,
        "hirePeriod": "HOUR_4",
        "price": 45.00,
        "updatedAt": "2025-03-01T00:00:00"
    }
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Pricing plan not found",
    "data": null
}
```

### 4.3 新增定价方案

#### 4.3.1 基本信息

> 请求路径：`/admin/pricing-plans`
> 
> 请求方式：`POST`
> 
> 接口描述：新增定价方案，仅管理员可用。

#### 4.3.2 请求参数

请求参数格式：`application/json`

| 参数名称       | 说明   | 类型     | 是否必需 | 备注                                       |
| ---------- | ---- | ------ | ---- | ---------------------------------------- |
| hirePeriod | 租期代码 | string | 是    | `HOUR_1` / `HOUR_4` / `DAY_1` / `WEEK_1` |
| price      | 价格   | number | 是    | 必须大于 0                                   |

请求数据样例：

```json
{
    "hirePeriod": "DAY_1",
    "price": 30.00
}
```

#### 4.3.3 响应数据

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": null
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Hire period already exists; use a different hire period code",
    "data": null
}
```

### 4.4 更新定价方案

#### 4.4.1 基本信息

> 请求路径：`/admin/pricing-plans/{id}`
> 
> 请求方式：`PUT`
> 
> 接口描述：更新指定定价方案，仅管理员可用。

#### 4.4.2 请求参数

请求参数格式：`application/json`

路径参数说明：

| 参数名称 | 说明    | 类型     | 是否必需 | 备注  |
| ---- | ----- | ------ | ---- | --- |
| id   | 方案 ID | number | 是    |     |

Body 参数说明：

| 参数名称       | 说明   | 类型     | 是否必需 | 备注           |
| ---------- | ---- | ------ | ---- | ------------ |
| hirePeriod | 租期代码 | string | 否    | 若传入则会参与唯一性校验 |
| price      | 价格   | number | 否    | 若传入则必须大于 0   |

请求数据样例：

```json
{
    "hirePeriod": "WEEK_1",
    "price": 120.00
}
```

#### 4.4.3 响应数据

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": null
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Update failed; hire period may duplicate another pricing plan",
    "data": null
}
```

### 4.5 删除定价方案

#### 4.5.1 基本信息

> 请求路径：`/admin/pricing-plans/{id}`
> 
> 请求方式：`DELETE`
> 
> 接口描述：删除指定定价方案，仅管理员可用。若已有订单使用该方案，则不能删除。

#### 4.5.2 请求参数

| 参数名称 | 说明    | 类型     | 是否必需 | 备注   |
| ---- | ----- | ------ | ---- | ---- |
| id   | 方案 ID | number | 是    | 路径参数 |

#### 4.5.3 响应数据

成功样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": null
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Pricing plan is used by existing bookings and cannot be deleted",
    "data": null
}
```

## 5. 管理端统计接口

### 5.1 查看最近一周收入统计

#### 5.1.1 基本信息

> 请求路径：`/admin/revenue/weekly`
> 
> 请求方式：`GET`
> 
> 接口描述：获取最近一周收入统计，仅管理员可用。统计结果按租赁类型聚合，并返回最受欢迎租期。

#### 5.1.2 请求参数

无

#### 5.1.3 响应数据

响应数据类型：`application/json`

| 名称                       | 类型     | 是否必需 | 备注                                       |
| ------------------------ | ------ | ---- | ---------------------------------------- |
| code                     | number | 必需   | 响应码：0-成功，1-失败                            |
| message                  | string | 非必需  | 提示信息                                     |
| data                     | object | 非必需  | 周收入统计结果                                  |
| \|-windowStart           | string | 非必需  | 统计窗口开始时间                                 |
| \|-windowEnd             | string | 非必需  | 统计窗口结束时间                                 |
| \|-mostPopularHirePeriod | string | 非必需  | 最受欢迎租期；无数据时可能为 `null`                    |
| \|-buckets               | array  | 非必需  | 各租期统计列表                                  |
| \|-\|-hirePeriod         | string | 非必需  | `HOUR_1` / `HOUR_4` / `DAY_1` / `WEEK_1` |
| \|-\|-orderCount         | number | 非必需  | 订单数量                                     |
| \|-\|-totalRevenue       | number | 非必需  | 总收入                                      |

响应数据样例：

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "windowStart": "2025-03-01T12:00:00",
        "windowEnd": "2025-03-08T12:00:00",
        "mostPopularHirePeriod": "HOUR_4",
        "buckets": [
            {
                "hirePeriod": "HOUR_1",
                "orderCount": 2,
                "totalRevenue": 30.00
            },
            {
                "hirePeriod": "HOUR_4",
                "orderCount": 3,
                "totalRevenue": 135.00
            },
            {
                "hirePeriod": "DAY_1",
                "orderCount": 1,
                "totalRevenue": 30.00
            },
            {
                "hirePeriod": "WEEK_1",
                "orderCount": 0,
                "totalRevenue": 0.00
            }
        ]
    }
}
```

失败样例：

```json
{
    "code": 1,
    "message": "Forbidden: admin only",
    "data": null
}
```
