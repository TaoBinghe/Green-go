package com.binghetao.controller;

import com.binghetao.domain.PricingPlan;
import com.binghetao.domain.Result;
import com.binghetao.service.PricingPlanService;
import com.binghetao.utils.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/pricing-plans")
public class AdminPricingPlanController {

    @Autowired
    private PricingPlanService pricingPlanService;

    @GetMapping
    public Result<List<PricingPlan>> list() {
        if (!AuthUtil.isAdmin()) {
            return Result.error("Forbidden: admin only");
        }
        List<PricingPlan> list = pricingPlanService.listAll();
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<PricingPlan> getById(@PathVariable Long id) {
        if (!AuthUtil.isAdmin()) {
            return Result.error("Forbidden: admin only");
        }
        PricingPlan plan = pricingPlanService.getById(id);
        if (plan == null) {
            return Result.error("Pricing plan not found");
        }
        return Result.success(plan);
    }

    @PostMapping
    public Result<?> create(@RequestBody PricingPlan plan) {
        if (!AuthUtil.isAdmin()) {
            return Result.error("Forbidden: admin only");
        }
        if (plan.getHirePeriod() == null || plan.getHirePeriod().isBlank()) {
            return Result.error("租期不能为空");
        }
        if (plan.getPrice() == null || plan.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return Result.error("价格必须大于 0");
        }
        boolean ok = pricingPlanService.create(plan);
        if (ok) {
            return Result.success();
        }
        return Result.error("租期已存在，请使用其他租期代码");
    }

    @PutMapping("/{id}")
    public Result<?> update(@PathVariable Long id, @RequestBody PricingPlan plan) {
        if (!AuthUtil.isAdmin()) {
            return Result.error("Forbidden: admin only");
        }
        if (plan.getPrice() != null && plan.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return Result.error("价格必须大于 0");
        }
        boolean ok = pricingPlanService.update(id, plan);
        if (ok) {
            return Result.success();
        }
        PricingPlan existing = pricingPlanService.getById(id);
        if (existing == null) {
            return Result.error("定价方案不存在");
        }
        return Result.error("更新失败，租期可能与其他方案重复");
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        if (!AuthUtil.isAdmin()) {
            return Result.error("Forbidden: admin only");
        }
        if (pricingPlanService.getById(id) == null) {
            return Result.error("定价方案不存在");
        }
        if (pricingPlanService.isUsedByBooking(id)) {
            return Result.error("该定价已被订单使用，无法删除");
        }
        boolean ok = pricingPlanService.delete(id);
        if (ok) {
            return Result.success();
        }
        return Result.error("删除失败");
    }
}
