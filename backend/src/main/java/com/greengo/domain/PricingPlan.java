package com.greengo.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Pricing plan entity.
 * Hire periods use UNIT_NUMBER codes such as HOUR_1 or DAY_3.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("pricing_plan")
public class PricingPlan {

    @TableId(type = IdType.AUTO)
    private Long id;


    /** Hire period code in UNIT_NUMBER format, e.g. HOUR_1 or DAY_3. */
    private String hirePeriod;

    private BigDecimal price;

    private LocalDateTime updatedAt;
}

