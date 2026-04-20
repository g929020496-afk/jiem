<template>
  <el-container class="admin-layout">
    <el-aside v-if="!isMobile" width="220px" class="aside">
      <div class="logo">
        <span class="logo-mark">JM</span>
        <span class="logo-text">JM 控制台</span>
      </div>
      <el-menu
        :default-active="active"
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/workbench">
          <i class="el-icon-mobile-phone" />
          <span slot="title">工作台</span>
        </el-menu-item>
        <el-menu-item index="/phone-link">
          <i class="el-icon-link" />
          <span slot="title">手机号链接</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container direction="vertical">
      <el-header height="56px" class="header">
        <div class="breadcrumb">
          <el-button
            v-if="isMobile"
            type="text"
            icon="el-icon-menu"
            class="mobile-menu-btn"
            @click="drawerVisible = true"
          />
          <span class="crumb-main">{{ title }}</span>
        </div>
        <div class="header-extra">
          <span class="muted">开放接口</span>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
    <el-drawer
      :visible.sync="drawerVisible"
      direction="ltr"
      size="220px"
      :with-header="false"
      custom-class="mobile-drawer"
      append-to-body
    >
      <div class="logo">
        <span class="logo-mark">JM</span>
        <span class="logo-text">JM 控制台</span>
      </div>
      <el-menu
        :default-active="active"
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
        @select="drawerVisible = false"
      >
        <el-menu-item index="/workbench">
          <i class="el-icon-mobile-phone" />
          <span slot="title">工作台</span>
        </el-menu-item>
        <el-menu-item index="/phone-link">
          <i class="el-icon-link" />
          <span slot="title">手机号链接</span>
        </el-menu-item>
      </el-menu>
    </el-drawer>
  </el-container>
</template>

<script>
export default {
  name: 'AdminLayout',
  data () {
    return {
      isMobile: false,
      drawerVisible: false
    }
  },
  computed: {
    active () {
      return this.$route.path
    },
    title () {
      return (this.$route.meta && this.$route.meta.title) || ''
    }
  },
  created () {
    this.handleResize()
  },
  mounted () {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize () {
      this.isMobile = window.innerWidth < 768
      if (!this.isMobile) this.drawerVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;
}
.aside {
  background: #1f2d3d;
  overflow-x: hidden;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  font-size: 13px;
  margin-right: 10px;
}
.logo-text {
  font-size: 15px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 0 20px;
}
.crumb-main {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.breadcrumb {
  display: flex;
  align-items: center;
}
.mobile-menu-btn {
  margin-right: 8px;
  font-size: 18px;
}
.muted {
  font-size: 13px;
  color: #909399;
}
.main {
  background: #f0f2f5;
  padding: 16px;
}
@media (max-width: 767px) {
  .header {
    padding: 0 12px;
  }
  .crumb-main {
    font-size: 15px;
  }
  .muted {
    font-size: 12px;
  }
  .main {
    padding: 10px;
  }
}
</style>
