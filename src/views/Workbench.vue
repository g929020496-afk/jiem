<template>
  <div class="workbench">
    <el-row :gutter="16" class="mb-16">
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">账户余额</div>
          <div class="stat-value">
            {{ balanceText }}
            <el-button type="text" icon="el-icon-refresh" class="ml-8" @click="refreshBalance" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="16">
        <el-card shadow="never">
          <div slot="header" class="card-header">
            <span>API Token</span>
            <el-button type="primary" size="small" @click="saveToken">保存到本地</el-button>
          </div>
          <el-input
            v-model="token"
            type="password"
            show-password
            clearable
            placeholder="请输入访问凭证（Token），仅保存在本机浏览器"
          />
          <div class="hint mt-8">
            正式环境请在网关将路径前缀 <code>/open-api-proxy</code> 转发至上游接口域名，并与本地开发代理保持一致。
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24">
        <el-card shadow="never">
          <div slot="header" class="card-header">
            <span>号码获取</span>
          </div>
          <el-form :inline="true" size="small" label-width="88px" class="query-form" @submit.native.prevent>
            <el-form-item label="项目关键词" class="form-item-keyword">
              <el-input v-model="form.keyWord" placeholder="与平台项目一致" clearable />
            </el-form-item>
            <el-form-item label="指定号码" class="form-item-phone">
              <el-input v-model="form.phone" placeholder="可选" clearable />
            </el-form-item>
            <el-form-item label="省份" class="form-item-province">
              <el-input v-model="form.province" placeholder="可留空" clearable />
            </el-form-item>
            <el-form-item label="卡类型" class="form-item-card-type">
              <el-select v-model="form.cardType" placeholder="卡类型">
                <el-option label="全部" value="全部" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loadingPhone" @click="handleGetPhone">获取号码</el-button>
            </el-form-item>
          </el-form>

          <el-alert v-if="lastPhoneRaw" :title="'接口返回：' + lastPhoneRaw" type="info" show-icon class="mb-12" />

          <div v-if="currentPhone" class="phone-row">
            <span class="label">当前号码</span>
            <span class="phone">{{ currentPhone }}</span>
            <el-button size="mini" type="text" @click="copyText(currentPhone)">复制</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="24">
        <el-card shadow="never">
          <div slot="header" class="card-header">
            <span>消息同步</span>
            <div>
              <el-switch v-model="autoPoll" active-text="自动轮询(5s)" class="mr-12" />
              <el-button type="primary" size="small" :loading="loadingMsg" :disabled="!canGetMsg" @click="handleGetMsg">立即同步</el-button>
              <el-button v-if="pollTimer" size="small" @click="stopPoll">停止轮询</el-button>
            </div>
          </div>

          <el-alert v-if="lastMsgRaw" :title="'接口返回：' + lastMsgRaw" type="success" show-icon class="mb-12" />

          <div v-if="parsedCode" class="code-box">
            <span class="label">解析结果</span>
            <span class="code">{{ parsedCode }}</span>
            <el-button size="mini" type="text" @click="copyText(parsedCode)">复制</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { leftAmount, getPhone, getMsg } from '@/api/vendorApi'

const TOKEN_KEY = 'jm_vendor_token'
const TOKEN_KEY_LEGACY = 'jiema_api_token'

export default {
  name: 'Workbench',
  data () {
    return {
      token: '',
      balanceText: '--',
      form: {
        keyWord: '海螺AI',
        phone: '',
        province: '',
        cardType: '全部'
      },
      currentPhone: '',
      lastPhoneRaw: '',
      lastMsgRaw: '',
      parsedCode: '',
      loadingPhone: false,
      loadingMsg: false,
      autoPoll: false,
      pollTimer: null
    }
  },
  computed: {
    canGetMsg () {
      return !!(this.token && this.currentPhone && this.form.keyWord)
    }
  },
  watch: {
    autoPoll (val) {
      if (val) this.startPoll()
      else this.stopPoll()
    }
  },
  created () {
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
  beforeDestroy () {
    this.stopPoll()
  },
  methods: {
    saveToken () {
      try {
        localStorage.setItem(TOKEN_KEY, this.token.trim())
        this.$message.success('已保存')
      } catch (e) {
        this.$message.error('保存失败')
      }
    },
    parseError (text) {
      if (!text) return ''
      const t = String(text)
      if (t.indexOf('ERROR') === 0 || t.toLowerCase().indexOf('error') === 0) return t
      return ''
    },
    async refreshBalance () {
      if (!this.token) {
        this.$message.warning('请先填写 Token')
        return
      }
      try {
        const raw = await leftAmount(this.token.trim())
        const err = this.parseError(raw)
        if (err) {
          this.balanceText = '--'
          this.$message.error(err)
          return
        }
        this.balanceText = raw
      } catch (e) {
        this.balanceText = '--'
        this.$message.error(e.message || '请求失败')
      }
    },
    extractPhone (raw) {
      const s = String(raw)
      const m = s.match(/1[3-9]\d{9}/)
      return m ? m[0] : ''
    },
    extractCode (raw) {
      const s = String(raw)
      const m = s.match(/\d{4,8}/)
      return m ? m[0] : ''
    },
    async handleGetPhone () {
      if (!this.token) {
        this.$message.warning('请先填写 Token')
        return
      }
      if (!this.form.keyWord) {
        this.$message.warning('请填写项目关键词')
        return
      }
      this.loadingPhone = true
      this.lastPhoneRaw = ''
      try {
        const raw = await getPhone({
          token: this.token.trim(),
          keyWord: this.form.keyWord.trim(),
          phone: this.form.phone.trim(),
          province: this.form.province.trim(),
          cardType: this.form.cardType
        })
        this.lastPhoneRaw = raw
        const err = this.parseError(raw)
        if (err) {
          this.currentPhone = ''
          this.$message.error(err)
          return
        }
        const phone = this.extractPhone(raw)
        this.currentPhone = phone || raw
        this.lastMsgRaw = ''
        this.parsedCode = ''
        if (this.autoPoll) {
          this.stopPoll()
          this.$nextTick(() => this.startPoll())
        }
        this.$message.success('号码已返回')
      } catch (e) {
        this.$message.error(e.message || '号码获取失败')
      } finally {
        this.loadingPhone = false
      }
    },
    async handleGetMsg () {
      if (!this.canGetMsg) {
        this.$message.warning('请确认凭证、关键词，并已获取号码')
        return
      }
      this.loadingMsg = true
      try {
        const raw = await getMsg({
          token: this.token.trim(),
          phone: this.currentPhone,
          keyWord: this.form.keyWord.trim()
        })
        this.lastMsgRaw = raw
        const err = this.parseError(raw)
        if (err) {
          this.parsedCode = ''
          this.$message.warning(err)
          return
        }
        const code = this.extractCode(raw)
        this.parsedCode = code || raw
        if (code) this.$message.success('内容已返回')
      } catch (e) {
        this.$message.error(e.message || '同步失败')
      } finally {
        this.loadingMsg = false
      }
    },
    startPoll () {
      this.stopPoll()
      if (!this.canGetMsg) return
      this.pollTimer = setInterval(() => {
        this.handleGetMsg()
      }, 5000)
    },
    stopPoll () {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },
    copyText (text) {
      const t = String(text || '')
      if (!t) return
      const ta = document.createElement('textarea')
      ta.value = t
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
    }
  }
}
</script>

<style lang="scss" scoped>
.workbench {
  max-width: 1200px;
  margin: 0 auto;
}
.mb-16 {
  margin-bottom: 16px;
}
.mt-16 {
  margin-top: 16px;
}
.mb-12 {
  margin-bottom: 12px;
}
.ml-8 {
  margin-left: 8px;
}
.mr-12 {
  margin-right: 12px;
}
.mt-8 {
  margin-top: 8px;
}
.stat-card {
  min-height: 112px;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.phone-row,
.code-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.phone-row .label,
.code-box .label {
  color: #606266;
  font-size: 13px;
}
.phone {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}
.code {
  font-size: 22px;
  font-weight: 700;
  color: #409eff;
  letter-spacing: 2px;
}

.query-form ::v-deep .form-item-keyword .el-input,
.query-form ::v-deep .form-item-keyword .el-input__inner {
  width: 220px;
}
.query-form ::v-deep .form-item-phone .el-input,
.query-form ::v-deep .form-item-phone .el-input__inner {
  width: 160px;
}
.query-form ::v-deep .form-item-province .el-input,
.query-form ::v-deep .form-item-province .el-input__inner {
  width: 120px;
}
.query-form ::v-deep .form-item-card-type .el-select {
  width: 110px;
}
@media (max-width: 767px) {
  .stat-value {
    font-size: 22px;
  }
  .card-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  .phone {
    font-size: 18px;
  }
  .code {
    font-size: 20px;
  }
  .query-form ::v-deep .el-form-item {
    display: flex;
    margin-right: 0;
    margin-bottom: 10px;
  }
  .query-form ::v-deep .el-form-item__label {
    width: 72px !important;
    text-align: left;
    padding-right: 8px;
  }
  .query-form ::v-deep .el-form-item__content {
    flex: 1;
    width: calc(100% - 72px);
  }
  .query-form ::v-deep .el-input,
  .query-form ::v-deep .el-input__inner,
  .query-form ::v-deep .el-select {
    width: 100% !important;
  }
}
</style>
