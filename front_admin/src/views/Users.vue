<template>
  <div class="users-page">
    <div class="page-header">
      <div>
        <h2 class="page-heading">User Management</h2>
        <p class="page-copy">Read-only user overview with quick filters for role and account status.</p>
      </div>
      <el-button @click="fetchUsers" :loading="loading">
        <el-icon><Refresh /></el-icon>
        Refresh
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :lg="8">
          <el-input
            v-model="searchText"
            placeholder="Search by username"
            prefix-icon="Search"
            clearable
            @clear="onSearch"
            @keyup.enter="onSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-select v-model="filterRole" placeholder="Filter by role" clearable @change="onSearch" style="width: 100%">
            <el-option label="CUSTOMER" value="CUSTOMER" />
            <el-option label="MANAGER" value="MANAGER" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-select v-model="filterStatus" placeholder="Filter by status" clearable @change="onSearch" style="width: 100%">
            <el-option label="Enabled" :value="1" />
            <el-option label="Disabled" :value="0" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="4">
          <el-button type="primary" @click="onSearch" style="width: 100%;">
            <el-icon><Search /></el-icon>
            Search
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <div class="table-scroll">
        <el-table :data="filteredUsers" stripe style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" sortable />
          <el-table-column prop="username" label="Username" width="180">
            <template #default="{ row }">
              <span style="font-weight: 500;">{{ row.username }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="Email" min-width="200">
            <template #default="{ row }">
              {{ row.email || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="role" label="Role" width="140">
            <template #default="{ row }">
              <el-tag :type="row.role === 'MANAGER' ? 'danger' : 'primary'" effect="plain">
                {{ row.role }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="Status" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? 'Enabled' : 'Disabled' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="Created At" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="Updated At" width="180">
            <template #default="{ row }">
              {{ formatTime(row.updatedAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="filteredUsers.length === 0 && !loading" class="empty-tip">
        <el-empty description="No users found" />
      </div>

      <div class="table-footer" v-if="allUsers.length > 0">
        <span class="summary-text">
          Total: {{ allUsers.length }} users
          ({{ allUsers.filter(u => u.role === 'CUSTOMER').length }} customers,
          {{ allUsers.filter(u => u.role === 'MANAGER').length }} managers)
        </span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { listUsers } from '@/api/admin'

interface UserItem {
  id: number
  username: string
  email: string | null
  role: string
  status: number
  createdAt: string
  updatedAt: string
}

const allUsers = ref<UserItem[]>([])
const loading = ref(false)
const searchText = ref('')
const filterRole = ref('')
const filterStatus = ref<number | ''>('')

const filteredUsers = computed(() => {
  let result = allUsers.value

  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(u => u.username.toLowerCase().includes(keyword))
  }

  if (filterRole.value) {
    result = result.filter(u => u.role === filterRole.value)
  }

  if (filterStatus.value !== '' && filterStatus.value !== null) {
    result = result.filter(u => u.status === filterStatus.value)
  }

  return result
})

function formatTime(timeStr: string): string {
  if (!timeStr) return '-'
  return timeStr.replace('T', ' ').substring(0, 19)
}

function onSearch() {
  // filteredUsers is computed, triggers automatically
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await listUsers()
    allUsers.value = res.data || []
  } catch {
    allUsers.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-page {
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

.filter-card {
  margin-bottom: 20px;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
}

.table-scroll :deep(.el-table) {
  min-width: 980px;
}

.empty-tip {
  padding: 40px 0;
}

.table-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.summary-text {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .page-header > .el-button {
    width: 100%;
  }
}
</style>
