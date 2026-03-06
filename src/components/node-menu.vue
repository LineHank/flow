<template>
  <div class="flow-menu">
    <a-menu theme="dark" style="border-right: 0; background: black;">
      <a-menu-item v-for="node in nodeList" :key="node.type" style="padding-top: 4px; padding-left: 14px"
                    v-if="node.type !== CommonNodeType.LINK && node.type !== HighNodeType.CHILD_FLOW">
        <a-tooltip :title="node.nodeName" placement="right">
          <div
            class="node-item"
            draggable="true"
            @dragstart="dragNode(node.type, type)"
          >
            <a-icon :type="node.icon" class="node-icon" />
          </div>
        </a-tooltip>
      </a-menu-item>
    </a-menu>
  </div>
</template>
<script>
  import {CommonNodeType, HighNodeType} from '@/config/type'

  export default {
    name: "NodeMenu",
    props: {
      nodeList: {
        type: Array,
        default: () => []
      },
      type: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        CommonNodeType: CommonNodeType,
        HighNodeType: HighNodeType
      }
    },
    methods: {
      // 开始拖拽
      dragNode(type, belongTo) {
        this.$emit("setDragInfo", {
          type,
          belongTo
        });
      }
    }
  };
</script>
<style scoped lang="less">
  .flow-menu {
    .ant-menu-item,
    .ant-menu-submenu-title {
      height: 40px;
      padding: 0 14px !important;
    }
    .node-icon {
      color: #fff;
      font-size: 16px;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
  }
</style>
