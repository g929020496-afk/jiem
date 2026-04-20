<template>
  <div class="phone-link-builder">
    <el-card shadow="never">
      <div slot="header" class="card-header">
        <span>手机号链接生成</span>
      </div>

      <el-form :inline="true" @submit.native.prevent>
        <el-form-item label="Token">
          <el-input
            v-model.trim="token"
            show-password
            clearable
            placeholder="请输入接口 Token"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="saveToken">保存 Token</el-button>
        </el-form-item>
        <el-form-item label="项目关键词">
          <el-input
            v-model.trim="form.keyWord"
            clearable
            placeholder="与平台项目一致"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="省份">
          <el-input
            v-model.trim="form.province"
            clearable
            placeholder="可留空"
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="卡类型">
          <el-select v-model="form.cardType" placeholder="卡类型" style="width: 110px">
            <el-option label="全部" value="全部" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loadingGetPhone" @click="handleGetPhoneByApi">接口取号并生成链接</el-button>
        </el-form-item>
      </el-form>

      <el-divider>手动补录（可选）</el-divider>

      <el-form :inline="true" @submit.native.prevent>
        <el-form-item label="手机号">
          <el-input
            v-model.trim="phone"
            placeholder="请输入 11 位手机号"
            clearable
            maxlength="11"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleGenerate">生成唯一链接</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="generatedLink"
        :closable="false"
        type="success"
        show-icon
        class="mt-12"
      >
        <template slot="title">
          <span>已生成：{{ generatedLink }}</span>
          <el-button type="text" class="ml-8" @click="copyLink">复制</el-button>
          <el-button type="text" @click="openLink">打开</el-button>
        </template>
      </el-alert>
    </el-card>

    <el-card shadow="never" class="mt-16">
      <div slot="header" class="card-header">
        <span>已生成记录</span>
      </div>
      <el-table :data="records" stripe>
        <el-table-column prop="phone" label="手机号" width="160" />
        <el-table-column label="链接">
          <template slot-scope="{ row }">
            <span>{{ makeLink(row.token, row.phone, row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template slot-scope="{ row }">
            <el-button type="text" @click="openRecordLink(row)">打开分享链接</el-button>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template slot-scope="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { getPhone } from '@/api/vendorApi'
import {
  createOrGetPhoneLinkRecord,
  listPhoneLinkRecords
} from '@/utils/phoneLinkStore'

const TOKEN_KEY = 'jm_vendor_token'
const TOKEN_KEY_LEGACY = 'jiema_api_token'

export default {
  name: 'PhoneLinkBuilder',
  data () {
    return {
      token: '',
      form: {
        keyWord: '海螺AI',
        province: '',
        cardType: '全部'
      },
      phone: '',
      generatedLink: '',
      records: [],
      loadingGetPhone: false
    }
  },
  created () {
    this.loadToken()
    this.refreshRecords()
  },
  methods: {
    encodePayload (phone, createdAt, token, keyWord) {
      const createdAt36 = Number(createdAt || Date.now()).toString(36)
      return `${phone}_${String(token || '')}_${createdAt36}_${encodeURIComponent(String(keyWord || ''))}`
    },
    loadToken () {
      try {
        let t = localStorage.getItem(TOKEN_KEY) || ''
        if (!t) {
          t = localStorage.getItem(TOKEN_KEY_LEGACY) || ''
          if (t) {
            localStorage.setItem(TOKEN_KEY, t)
            localStorage.removeItem(TOKEN_KEY_LEGACY)
          }
        }
        this.token = t
      } catch (e) {}
    },
    saveToken () {
      try {
        localStorage.setItem(TOKEN_KEY, this.token.trim())
        this.$message.success('Token 已保存')
      } catch (e) {
        this.$message.error('Token 保存失败')
      }
    },
    makeLink (token, phone, createdAt) {
      const origin = window.location.origin
      const payload = this.encodePayload(phone, createdAt, this.token, this.form.keyWord)
      return `${origin}/phone-verify/${token}?p=${payload}`
    },
    refreshRecords () {
      this.records = listPhoneLinkRecords()
    },
    formatTime (ts) {
      if (!ts) return '--'
      const d = new Date(ts)
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    },
    copyText (text) {
      const ta = document.createElement('textarea')
      ta.value = String(text || '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        this.$message.success('已复制到剪贴板')
      } catch (e) {
        this.$message.error('复制失败')
      }
      document.body.removeChild(ta)
    },
    copyLink () {
      this.copyText(this.generatedLink)
    },
    openLink () {
      if (!this.generatedLink) return
      window.open(this.generatedLink, '_blank')
    },
    openRecordLink (row) {
      if (!row) return
      const link = this.makeLink(row.token, row.phone, row.createdAt)
      window.open(link, '_blank')
    },
    parseError (text) {
      if (!text) return ''
      const t = String(text)
      if (t.indexOf('ERROR') === 0 || t.toLowerCase().indexOf('error') === 0) return t
      return ''
    },
    extractPhone (raw) {
      const s = String(raw || '')
      const m = s.match(/1[3-9]\d{9}/)
      return m ? m[0] : ''
    },
    async handleGetPhoneByApi () {
      if (!this.token) {
        this.$message.warning('请先填写 Token')
        return
      }
      if (!this.form.keyWord) {
        this.$message.warning('请填写项目关键词')
        return
      }
      this.loadingGetPhone = true
      try {
        const raw = await getPhone({
          token: this.token.trim(),
          keyWord: this.form.keyWord.trim(),
          phone: '',
          province: this.form.province.trim(),
          cardType: this.form.cardType
        })
        const err = this.parseError(raw)
        if (err) {
          this.$message.error(err)
          return
        }
        const p = this.extractPhone(raw)
        if (!p) {
          this.$message.error('接口未返回有效手机号')
          return
        }
        this.phone = p
        this.handleGenerate()
      } catch (e) {
        this.$message.error(e.message || '接口取号失败')
      } finally {
        this.loadingGetPhone = false
      }
    },
    handleGenerate () {
      try {
        const record = createOrGetPhoneLinkRecord(this.phone)
        this.generatedLink = this.makeLink(record.token, record.phone, record.createdAt)
        this.refreshRecords()
        this.$message.success('生成成功')
      } catch (e) {
        this.$message.error(e.message || '生成失败')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.phone-link-builder {
  max-width: 1200px;
  margin: 0 auto;
}
.card-header {
  font-size: 15px;
  font-weight: 600;
}
.mt-12 {
  margin-top: 12px;
}
.mt-16 {
  margin-top: 16px;
}
.ml-8 {
  margin-left: 8px;
}
</style>
