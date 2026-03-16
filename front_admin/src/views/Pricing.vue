<template>
  <div class="pricing-page">
    <h2 class="page-heading">价格方案管理</h2>

    <!-- Plan Cards -->
    <el-row :gutter="20" class="plan-cards">
      <el-col :span="6" v-for="plan in plans" :key="plan.id">
        <el-card shadow="hover" class="plan-card">
          <div class="plan-icon">
            <el-icon :size="32" color="#07c160"><Timer /></el-icon>
          </div>
          <div class="plan-period">{{ formatPeriod(plan.hirePeriod) }}</div>
          <div class="plan-price">£{{ Number(plan.price).toFixed(2) }}</div>
          <div class="plan-code">{{ plan.hirePeriod }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Plan Table with CRUD -->
    <el-card>
      <template #header>
        <div class="table-header">
          <span class="card-title">全部价格方案</span>
          <div>
            <el-button :loading="loading" @click="loadPlans">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="primary" @click="openAdd">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="plans" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="hirePeriod" label="租期代码" width="200">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.hirePeriod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="显示名称" width="200">
          <template #default="{ row }">
            {{ formatPeriod(row.hirePeriod) }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格 (£)" width="150">
          <template #default="{ row }">
            <span style="font-weight: 600; color: #07c160; font-size: 16px;">
              £{{ Number(row.price).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="200">
          <template #default="{ row }">
            {{ row.updatedAt?.replace('T', ' ') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑价格方案' : '新增价格方案'"
      width="420px"
      @close="resetForm"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="租期代码" required>
          <el-input
            v-model="form.hirePeriod"
            placeholder="如 HOUR_1, HOUR_4, DAY_1, WEEK_1"
            :disabled="isEdit"
          />
          <span v-if="isEdit" class="form-tip">租期代码不可修改</span>
        </el-form-item>
        <el-form-item label="价格 (£)" required>
          <el-input-number v-model="form.price" :min="0.01" :precision="2" :step="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">
          {{ isEdit ? '保存' : '新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPricingPlanList,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  type PricingPlanDto
} from '@/api/admin'

const plans = ref<PricingPlanDto[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  hirePeriod: '',
  price: 5
})

function formatPeriod(period: string): string {
  const map: Record<string, string> = {
    HOUR_1: '1 小时',
    HOUR_4: '4 小时',
    DAY_1: '1 天',
    WEEK_1: '1 周'
  }
  return map[period] || period
}

async function loadPlans() {
  loading.value = true
  try {
    const res = await getPricingPlanList()
    plans.value = res.data ?? []
  } catch {
    plans.value = []
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  editingId.value = null
  form.value = { hirePeriod: '', price: 5 }
  dialogVisible.value = true
}

function openEdit(row: PricingPlanDto) {
  isEdit.value = true
  editingId.value = row.id ?? null
  form.value = {
    hirePeriod: row.hirePeriod ?? '',
    price: Number(row.price) ?? 0
  }
  dialogVisible.value = true
}

function resetForm() {
  form.value = { hirePeriod: '', price: 5 }
  editingId.value = null
}

async function submitForm() {
  const period = form.value.hirePeriod?.trim()
  if (!period) {
    ElMessage.warning('请输入租期代码')
    return
  }
  if (form.value.price == null || form.value.price <= 0) {
    ElMessage.warning('价格必须大于 0')
    return
  }
  submitLoading.value = true
  try {
    if (isEdit.value && editingId.value != null) {
      await updatePricingPlan(editingId.value, { price: form.value.price })
      ElMessage.success('更新成功')
    } else {
      await createPricingPlan({ hirePeriod: period, price: form.value.price })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await loadPlans()
  } catch (e: any) {
    const msg = e?.message || e?.msg || '操作失败'
    ElMessage.error(msg)
  } finally {
    submitLoading.value = false
  }
}

function confirmDelete(row: PricingPlanDto) {
  const id = row.id
  if (id == null) return
  ElMessageBox.confirm(
    `确定要删除「${formatPeriod(row.hirePeriod)}」（${row.hirePeriod}）吗？`,
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deletePricingPlan(id)
      ElMessage.success('删除成功')
      await loadPlans()
    } catch (e: any) {
      const msg = e?.message || e?.msg || '删除失败'
      ElMessage.error(msg)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadPlans()
})
</script>

<style scoped>
.pricing-page {
  max-width: 1200px;
}

.page-heading {
  font-size: 22px;
  font-weight: 600;
  color: #1d1e1f;
  margin-bottom: 20px;
}

.plan-cards {
  margin-bottom: 20px;
}

.plan-card {
  text-align: center;
  padding: 10px 0;
}

.plan-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.plan-icon {
  width: 60px;
  height: 60px;
  background-color: #e8f5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plan-period {
  font-size: 18px;
  font-weight: 600;
  color: #1d1e1f;
}

.plan-price {
  font-size: 28px;
  font-weight: 700;
  color: #07c160;
}

.plan-code {
  font-size: 12px;
  color: #999;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: block;
}
</style>
