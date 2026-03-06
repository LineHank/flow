<template>
  <div>
    <a-drawer
      class="flow-drawer"
      title="设置"
      placement="right"
      :width="600"
      :visible="settingVisible"
      @close="close"
      style="z-index: 1001"
    >
      <a-form class="flow-drawer-form"
        :label-col="{ span: 8 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-divider orientation="left">画布</a-divider>
        <a-form-item label="缩小比例">
          <a-slider
            :min="0.05"
            :max="0.5"
            :step="0.05"
            :tipFormatter="formatterContainerOnceNarrow"
            v-model="containerOnceNarrow"
            @change="setContainerOnceNarrow"
          />
        </a-form-item>
        <a-form-item label="放大比例">
          <a-slider
            :min="0.05"
            :max="0.5"
            :step="0.05"
            :tipFormatter="formatterContainerOnceEnlarge"
            v-model="containerOnceEnlarge"
            @change="setContainerOnceEnlarge"
          />
        </a-form-item>

        <a-divider orientation="left">默认样式</a-divider>
        <a-form-item label="辅助线">
          <a-switch
            :checked="isOpenAuxiliaryLine === '开' || isOpenAuxiliaryLine === true"
            @change="toggleOpenAuxiliaryLine"
          />
          <span style="margin-left: 8px;">{{ (isOpenAuxiliaryLine === '开' || isOpenAuxiliaryLine === true) ? '开' : '关' }}</span>
        </a-form-item>
        <a-form-item label="自动对齐水平间距">
          <a-slider
            :min="10"
            :max="800"
            :step="5"
            v-model="alignLevelDistance"
            @change="setAlignLevelDistance"
          />
        </a-form-item>
        <a-form-item label="自动对齐垂直间距">
          <a-slider
            :min="10"
            :max="800"
            :step="5"
            v-model="alignVerticalDistance"
            @change="setAlignVerticalDistance"
          />
        </a-form-item>
        <a-form-item label="微移距离">
          <a-slider
            :min="1"
            v-model="movePx"
            @change="setMovePx"
          />
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script>
  import {flowConfig} from '@/config/flow-config'

  export default {
    data() {
      return {
        settingVisible: false,
        settingForm: {},
        isOpenAuxiliaryLine: flowConfig.defaultStyle.isOpenAuxiliaryLine,
        movePx: flowConfig.defaultStyle.movePx,
        alignLevelDistance: flowConfig.defaultStyle.alignSpacing.level,
        alignVerticalDistance: flowConfig.defaultStyle.alignSpacing.vertical,
        containerOnceNarrow: flowConfig.defaultStyle.containerScale.onceNarrow,
        containerOnceEnlarge: flowConfig.defaultStyle.containerScale.onceEnlarge
      }
    },
    methods: {
      open() {
        this.settingVisible = true
      },
      close() {
        this.settingVisible = false
      },
      toggleOpenAuxiliaryLine(checked) {
        this.isOpenAuxiliaryLine = checked ? '开' : '关'
        flowConfig.defaultStyle.isOpenAuxiliaryLine = checked
      },
      setMovePx(v) {
        flowConfig.defaultStyle.movePx = v
      },
      setAlignLevelDistance(v) {
        flowConfig.defaultStyle.alignSpacing.level = v
      },
      setAlignVerticalDistance(v) {
        flowConfig.defaultStyle.alignSpacing.vertical = v
      },
      formatterContainerOnceNarrow(v) {
        return `${v * 100}%`
      },
      setContainerOnceNarrow(v) {
        flowConfig.defaultStyle.containerScale.onceNarrow = v
      },
      formatterContainerOnceEnlarge(v) {
        return `${v * 100}%`
      },
      setContainerOnceEnlarge(v) {
        flowConfig.defaultStyle.containerScale.onceEnlarge = v
      }
    }
  }
</script>

<style scoped lang="less">
.flow-drawer-form {
  .ant-form-item {
    margin: 0 40px 10px!important;
  }
  /deep/ .ant-form-item-control {
    margin-left: 0!important;
  }
}
</style>
