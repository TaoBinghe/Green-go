<template>
  <div class="scooters-page">
    <div class="page-header">
      <div>
        <h2 class="page-heading">Scooter Management</h2>
        <p class="page-copy">Manage scooter status, coordinates, and resolved map locations.</p>
      </div>
      <div class="header-actions">
        <el-button :loading="tableLoading" @click="fetchScooters">
          <el-icon><Refresh /></el-icon>
          Refresh
        </el-button>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          Add Scooter
        </el-button>
      </div>
    </div>

    <el-card>
      <div class="table-scroll">
        <el-table :data="scooters" stripe style="width: 100%" v-loading="tableLoading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="scooterCode" label="Scooter Code" min-width="160">
            <template #default="{ row }">
              <el-tag type="success" effect="plain">{{ row.scooterCode }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="Status" width="150">
            <template #default="{ row }">
              <el-tag :type="row.status === 'AVAILABLE' ? 'success' : 'danger'">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="Location" min-width="220">
            <template #default="{ row }">
              <span>{{ row.location || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Coordinates" min-width="220">
            <template #default="{ row }">
              <div class="coordinate-cell">
                <span>{{ formatCoordinate(row.longitude) }}</span>
                <span>{{ formatCoordinate(row.latitude) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="Updated At" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.updatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="190" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openEditDialog(row)">
                <el-icon><Edit /></el-icon>
                Edit
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                Delete
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="scooters.length === 0 && !tableLoading" class="empty-tip">
        <el-empty description="No scooters available yet." />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'Edit Scooter' : 'Add Scooter'"
      width="min(640px, 92vw)"
      :close-on-click-modal="false"
      @close="resetDialog"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogForm"
        :rules="dialogRules"
        label-position="top"
      >
        <el-form-item label="Scooter Code" prop="scooterCode">
          <el-input v-model="dialogForm.scooterCode" placeholder="e.g. SC001" />
        </el-form-item>

        <el-form-item label="Status" prop="status">
          <el-select v-model="dialogForm.status" style="width: 100%">
            <el-option label="AVAILABLE" value="AVAILABLE" />
            <el-option label="UNAVAILABLE" value="UNAVAILABLE" />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="Longitude" prop="longitude">
              <el-input-number
                v-model="dialogForm.longitude"
                :min="-180"
                :max="180"
                :precision="6"
                :step="0.000001"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Latitude" prop="latitude">
              <el-input-number
                v-model="dialogForm.latitude"
                :min="-90"
                :max="90"
                :precision="6"
                :step="0.000001"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" plain :loading="resolving" @click="handleResolveLocation">
            Resolve Location
          </el-button>
        </el-form-item>

        <el-form-item label="Resolved Location">
          <div class="resolved-panel" :class="{ 'resolved-panel-pending': !isResolvedForCurrentCoordinates }">
            <div class="resolved-title">
              {{ isResolvedForCurrentCoordinates ? 'Ready to save' : 'Resolution required' }}
            </div>
            <div class="resolved-copy">
              {{
                isResolvedForCurrentCoordinates
                  ? resolvedLocation
                  : 'Resolve the current coordinates before saving this scooter.'
              }}
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? 'Save Changes' : 'Create Scooter' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  addScooter,
  deleteScooter,
  listScooters,
  resolveScooterLocation,
  updateScooter,
  type ScooterDto
} from '@/api/admin'
import { formatDateTime } from '@/utils/admin-display'

interface ScooterFormState {
  id?: number
  scooterCode: string
  status: string
  longitude: number | null
  latitude: number | null
}

const scooters = ref<ScooterDto[]>([])
const tableLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const resolving = ref(false)
const dialogFormRef = ref<FormInstance>()
const resolvedLocation = ref('')
const resolvedCoordinateKey = ref('')

const dialogForm = reactive<ScooterFormState>({
  id: undefined,
  scooterCode: '',
  status: 'AVAILABLE',
  longitude: null,
  latitude: null
})

const dialogRules: FormRules = {
  scooterCode: [{ required: true, message: 'Please enter scooter code', trigger: 'blur' }],
  status: [{ required: true, message: 'Please select status', trigger: 'change' }],
  longitude: [{ required: true, message: 'Please enter longitude', trigger: 'change' }],
  latitude: [{ required: true, message: 'Please enter latitude', trigger: 'change' }]
}

const currentCoordinateKey = computed(() => makeCoordinateKey(dialogForm.longitude, dialogForm.latitude))
const isResolvedForCurrentCoordinates = computed(() => {
  return !!resolvedLocation.value && currentCoordinateKey.value !== '' && currentCoordinateKey.value === resolvedCoordinateKey.value
})

function makeCoordinateKey(longitude: number | null, latitude: number | null) {
  if (longitude == null || latitude == null) return ''
  if (Number.isNaN(longitude) || Number.isNaN(latitude)) return ''
  return `${longitude}:${latitude}`
}

function hasValidCoordinates(longitude: number | null, latitude: number | null) {
  if (longitude == null || latitude == null) return false
  return longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
}

function formatCoordinate(value: number | null | undefined) {
  return value == null ? '-' : Number(value).toFixed(6)
}

async function fetchScooters() {
  tableLoading.value = true
  try {
    const res = await listScooters()
    scooters.value = res.data || []
  } catch {
    scooters.value = []
  } finally {
    tableLoading.value = false
  }
}

function resetDialog() {
  dialogForm.id = undefined
  dialogForm.scooterCode = ''
  dialogForm.status = 'AVAILABLE'
  dialogForm.longitude = null
  dialogForm.latitude = null
  resolvedLocation.value = ''
  resolvedCoordinateKey.value = ''
  dialogFormRef.value?.clearValidate()
}

function openAddDialog() {
  isEdit.value = false
  resetDialog()
  dialogVisible.value = true
}

function openEditDialog(row: ScooterDto) {
  isEdit.value = true
  dialogForm.id = row.id
  dialogForm.scooterCode = row.scooterCode
  dialogForm.status = row.status
  dialogForm.longitude = row.longitude
  dialogForm.latitude = row.latitude
  resolvedLocation.value = row.location || ''
  resolvedCoordinateKey.value = makeCoordinateKey(row.longitude, row.latitude)
  dialogVisible.value = true
}

async function handleResolveLocation() {
  if (!hasValidCoordinates(dialogForm.longitude, dialogForm.latitude)) {
    ElMessage.warning('Please enter valid longitude and latitude values first.')
    return
  }

  resolving.value = true
  try {
    const res = await resolveScooterLocation(dialogForm.longitude!, dialogForm.latitude!)
    resolvedLocation.value = res.data || ''
    resolvedCoordinateKey.value = currentCoordinateKey.value
    ElMessage.success('Location resolved successfully.')
  } catch {
    resolvedLocation.value = ''
    resolvedCoordinateKey.value = ''
  } finally {
    resolving.value = false
  }
}

async function handleSubmit() {
  if (!dialogFormRef.value) return

  await dialogFormRef.value.validate(async (valid) => {
    if (!valid) return

    if (!hasValidCoordinates(dialogForm.longitude, dialogForm.latitude)) {
      ElMessage.warning('Please enter valid coordinates before saving.')
      return
    }

    if (!isResolvedForCurrentCoordinates.value) {
      ElMessage.warning('Please resolve the current coordinates before saving.')
      return
    }

    submitting.value = true
    try {
      const payload = {
        scooterCode: dialogForm.scooterCode.trim(),
        status: dialogForm.status,
        longitude: dialogForm.longitude!,
        latitude: dialogForm.latitude!
      }

      if (isEdit.value && dialogForm.id != null) {
        await updateScooter({
          id: dialogForm.id,
          ...payload
        })
        ElMessage.success('Scooter updated successfully.')
      } else {
        await addScooter(payload)
        ElMessage.success('Scooter created successfully.')
      }

      dialogVisible.value = false
      await fetchScooters()
    } catch {
      // request interceptor handles backend messages
    } finally {
      submitting.value = false
    }
  })
}

async function handleDelete(row: ScooterDto) {
  if (!row.id) return

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete scooter ${row.scooterCode}?`,
      'Delete Scooter',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    await deleteScooter(row.id)
    ElMessage.success('Scooter deleted successfully.')
    await fetchScooters()
  } catch (error: any) {
    if (error !== 'cancel') {
      // request interceptor handles backend messages
    }
  }
}

onMounted(() => {
  fetchScooters()
})
</script>

<style scoped>
.scooters-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.page-heading {
  font-size: 24px;
  font-weight: 700;
  color: #1d1e1f;
}

.page-copy {
  margin-top: 8px;
  color: #6b7280;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
}

.table-scroll :deep(.el-table) {
  min-width: 920px;
}

.coordinate-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
}

.resolved-panel {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: #eef8f1;
  border: 1px solid #cce9d3;
}

.resolved-panel-pending {
  background: #fff7e6;
  border-color: #f3d18a;
}

.resolved-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.resolved-copy {
  margin-top: 6px;
  color: #4b5563;
  line-height: 1.6;
  word-break: break-word;
}

.empty-tip {
  padding: 40px 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions :deep(.el-button) {
    flex: 1;
    min-width: 0;
  }
}
</style>
