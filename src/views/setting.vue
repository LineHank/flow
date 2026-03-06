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

        <a-divider orientation="left">连线</a-divider>
        <a-form-item label="类型">
          <a-select v-model="linkType" @change="setFlowType" style="width: 100%">
            <a-select-option value="Bezier">贝塞尔曲线</a-select-option>
            <a-select-option value="Straight">直线</a-select-option>
            <a-select-option value="Flowchart">流程图线</a-select-option>
            <a-select-option value="StateMachine">状态线</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="颜色">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="color" v-model="linkColor" @change="setLinkColorFromInput" style="width: 40px; height: 32px; border: 1px solid #d9d9d9; border-radius: 4px; cursor: pointer;"/>
            <a-input v-model="linkColor" @change="setLinkColor" style="width: 100px;"/>
          </div>
        </a-form-item>
        <a-form-item label="粗细">
          <a-slider
            :min="1"
            :max="10"
            v-model="linkThickness"
            @change="setStrokeWidth"
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
        linkColor: flowConfig.jsPlumbInsConfig.PaintStyle.stroke,

        movePx: flowConfig.defaultStyle.movePx,
        linkType: flowConfig.jsPlumbInsConfig.Connector[0],
        linkThickness: flowConfig.jsPlumbInsConfig.PaintStyle.strokeWidth,
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
      setFlowType(v) {
        flowConfig.jsPlumbInsConfig.Connector[0] = v
      },
      toggleOpenAuxiliaryLine(checked) {
        this.isOpenAuxiliaryLine = checked ? '开' : '关'
        flowConfig.defaultStyle.isOpenAuxiliaryLine = checked
      },
      setMovePx(v) {
        flowConfig.defaultStyle.movePx = v
      },
      setLinkColor(e) {
        const v = e.target ? e.target.value : e
        this.linkColor = v
        flowConfig.jsPlumbInsConfig.PaintStyle.stroke = v
      },
      setLinkColorFromInput(e) {
        const v = e.target.value
        this.linkColor = v
        flowConfig.jsPlumbInsConfig.PaintStyle.stroke = v
      },
      setStrokeWidth(v) {
        flowConfig.jsPlumbInsConfig.PaintStyle.strokeWidth = v
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
