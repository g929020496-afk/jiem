<template>
  <div class="verify-page">
    <div class="panel">
      <div class="phone-row">
        <span class="phone">{{ phone || '--' }}</span>
        <button class="btn-purple" type="button" @click="copyPhone">复制手机号</button>
      </div>

      <div class="status-line">已取号，信息将于手机号在线释放后通知...</div>

      <div class="remain">剩余时间: {{ remainText }}</div>
      <div class="wait">已经在路上，请持续等待</div>

      <div class="code-row">
        <span class="code-label">验证码(即将显示)</span>
        <button class="btn-gray" type="button" :disabled="releaseLoading || !canRelease" @click="handleRelease">
          {{ releaseLoading ? '释放中...' : '手动释放' }}
        </button>
      </div>

      <div v-if="!phone" class="error">链接无效或已失效</div>
      <div v-else-if="released" class="ok">号码已释放</div>
    </div>
  </div>
</template>

<script>
import { getMsg, releasePhone } from '@/api/vendorApi'
import { getRecordByToken } from '@/utils/phoneLinkStore'

export default {
  name: 'PhoneVerifyPage',
  data () {
    return {
      phone: '',
      token: '',
      createdAt: 0,
      keyWord: '',
      remainMs: 20 * 60 * 1000,
      released: false,
      releaseLoading: false,
      timer: null,
      msgTimer: null,
      code: '',
      msgLoading: false
    }
  },
  computed: {
    remainText () {
      const ms = Math.max(0, this.remainMs)
      const totalSec = Math.ceil(ms / 1000)
      const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
      const ss = String(totalSec % 60).padStart(2, '0')
      return `${mm}:${ss}`
    },
    canRelease () {
      return !!(this.token && this.phone && !this.released)
    }
  },
  created () {
    const routeToken = this.$route.params.token || ''
    const parsed = this.getPayloadFromQuery()
    const record = getRecordByToken(routeToken)
    if (record && record.phone) {
      this.phone = record.phone
      this.createdAt = Number(record.createdAt || Date.now())
    } else if (parsed.phone) {
      this.phone = parsed.phone
      this.createdAt = parsed.createdAt || Date.now()
    }
    this.token = parsed.token
    this.keyWord = parsed.keyWord
    this.startCountdown()
    this.startMsgPoll()
  },
  beforeDestroy () {
    this.stopCountdown()
    this.stopMsgPoll()
  },
  methods: {
    getPayloadFromQuery () {
      const result = { phone: '', token: '', createdAt: 0, keyWord: '' }
      const payload = this.$route.query && this.$route.query.p
      if (!payload) return result
      try {
        const [p, tk, ct, kw] = String(payload).split('_')
        if (/^1[3-9]\d{9}$/.test(String(p || ''))) result.phone = String(p)
        if (tk) result.token = String(tk)
        if (ct) {
          const createdAt = parseInt(ct, 36)
          if (!isNaN(createdAt) && createdAt > 0) result.createdAt = createdAt
        }
        if (kw) result.keyWord = decodeURIComponent(String(kw))
      } catch (e) {}
      return result
    },
    startCountdown () {
      this.stopCountdown()
      const beginAt = this.createdAt || Date.now()
      this.remainMs = Math.max(0, beginAt + 20 * 60 * 1000 - Date.now())
      if (!this.phone || this.released) return
      this.timer = setInterval(async () => {
        this.remainMs = Math.max(0, beginAt + 20 * 60 * 1000 - Date.now())
        if (this.remainMs <= 0) {
          this.stopCountdown()
          await this.handleRelease(true)
        }
      }, 1000)
    },
    stopCountdown () {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    parseError (text) {
      if (!text) return ''
      const t = String(text)
      if (t.indexOf('ERROR') === 0 || t.toLowerCase().indexOf('error') === 0) return t
      return ''
    },
    extractCode (raw) {
      const s = String(raw || '')
      const m = s.match(/\d{4,8}/)
      return m ? m[0] : ''
    },
    async fetchMsg () {
      if (!this.token || !this.phone || !this.keyWord || this.released) return
      if (this.msgLoading) return
      this.msgLoading = true
      try {
        const raw = await getMsg({
          token: this.token.trim(),
          phone: this.phone,
          keyWord: this.keyWord
        })
        const err = this.parseError(raw)
        if (err) return
        const parsed = this.extractCode(raw)
        if (parsed) this.code = parsed
      } catch (e) {
      } finally {
        this.msgLoading = false
      }
    },
    startMsgPoll () {
      this.stopMsgPoll()
      if (!this.phone || !this.token || !this.keyWord || this.released) return
      this.fetchMsg()
      this.msgTimer = setInterval(() => {
        this.fetchMsg()
      }, 5000)
    },
    stopMsgPoll () {
      if (this.msgTimer) {
        clearInterval(this.msgTimer)
        this.msgTimer = null
      }
    },
    async handleRelease (isAuto = false) {
      if (!this.canRelease || this.releaseLoading) return
      this.releaseLoading = true
      try {
        const raw = await releasePhone({
          token: this.token.trim(),
          phone: this.phone
        })
        const err = this.parseError(raw)
        if (err) {
          this.$message.error(err)
          return
        }
        this.released = true
        this.remainMs = 0
        this.stopCountdown()
        this.stopMsgPoll()
        if (!isAuto) this.$message.success('号码已手动释放')
      } catch (e) {
        this.$message.error(e.message || '释放失败')
      } finally {
        this.releaseLoading = false
      }
    },
    copyPhone () {
      if (!this.phone) return
      const ta = document.createElement('textarea')
      ta.value = this.phone
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        this.$message.success('手机号已复制')
      } catch (e) {}
      document.body.removeChild(ta)
    },
    copyCode () {
      if (!this.code) return
      const ta = document.createElement('textarea')
      ta.value = this.code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        this.$message.success('验证码已复制')
      } catch (e) {}
      document.body.removeChild(ta)
    }
  }
}
</script>

<style lang="scss" scoped>
.verify-page {
  min-height: 100vh;
  background: #0f0f10;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}
.panel {
  width: 360px;
  background: #fff;
  border-radius: 10px;
  padding: 18px 16px;
}
.phone-row {
  border: 1px dashed #79bac6;
  border-radius: 6px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}
.phone {
  color: #2a9caf;
  font-weight: 700;
  letter-spacing: 1px;
}
.btn-purple,
.btn-gray {
  border: 0;
  border-radius: 4px;
  color: #fff;
  padding: 6px 10px;
  cursor: pointer;
}
.btn-purple {
  background: #8f57d6;
}
.btn-gray {
  background: #d4d8de;
}
.btn-gray:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.status-line {
  margin-top: 12px;
  background: #f6f6f6;
  color: #9da3ad;
  font-size: 12px;
  text-align: center;
  padding: 8px 10px;
}
.remain {
  margin-top: 14px;
  text-align: center;
  color: #bf4e48;
  font-size: 30px;
  font-weight: 700;
}
.wait {
  margin-top: 8px;
  text-align: center;
  color: #c34f49;
  font-size: 24px;
  font-weight: 700;
}
.code-row {
  margin-top: 16px;
  border: 1px solid #f0c9cb;
  border-radius: 6px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}
.code-label {
  color: #a84343;
  font-size: 14px;
}
.error {
  margin-top: 12px;
  text-align: center;
  color: #f56c6c;
}
.ok {
  margin-top: 12px;
  text-align: center;
  color: #67c23a;
}
.mt-8 {
  margin-top: 8px;
}
</style>
