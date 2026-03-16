package com.binghetao.controller;

import com.binghetao.domain.Result;
import com.binghetao.domain.Scooter;
import com.binghetao.service.ScooterService;
import com.binghetao.utils.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Admin scooter CRUD API
@RestController
@RequestMapping("/admin/scooter")
public class AdminScooterController {

    @Autowired
    private ScooterService scooterService;

    @GetMapping("/list")
    public Result<List<Scooter>> list() {
        if (!AuthUtil.isAdmin()) {
            return Result.error("Forbidden: admin only");
        }
        List<Scooter> scooters = scooterService.listAll();
        return Result.success(scooters);
    }

    @PostMapping("/add")
    public Result<?> add(@RequestBody Scooter scooter) {
        if (!AuthUtil.isAdmin()) {
            return Result.error("Forbidden: admin only");
        }
        boolean ok = scooterService.addScooter(scooter);
        if (ok) {
            return Result.success();
        }
        return Result.error("Failed to add scooter, code may already exist");
    }

    // Update scooter by id
    @PostMapping("/update")
    public Result<?> update(@RequestBody Scooter scooter) {
        if (!AuthUtil.isAdmin()) {
            return Result.error("Forbidden: admin only");
        }
        boolean ok = scooterService.updateScooter(scooter);
        if (ok) {
            return Result.success();
        }
        return Result.error("Failed to update scooter, record not found or code duplicated");
    }

    // Delete scooter by id
    @DeleteMapping("/delete")
    public Result<?> delete(@RequestParam Long id) {
        if (!AuthUtil.isAdmin()) {
            return Result.error("Forbidden: admin only");
        }
        boolean ok = scooterService.deleteScooter(id);
        if (ok) {
            return Result.success();
        }
        return Result.error("Failed to delete scooter, record not found");
    }
}

