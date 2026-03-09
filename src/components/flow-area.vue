<template>
  <div
    style="width: 100%; height: 100%; overflow: hidden; position: relative;"
  >
    <!--辅助线X-->
    <div v-if="container.auxiliaryLine.isOpen && container.auxiliaryLine.isShowXLine"
      class="auxiliary-line-x"
      :style="{ top: auxiliaryLinePos.y + 'px' }"
    ></div>
    <!--辅助线Y-->
    <div v-if="container.auxiliaryLine.isOpen && container.auxiliaryLine.isShowYLine"
      class="auxiliary-line-y"
      :style="{ left: auxiliaryLinePos.x + 'px' }"
    ></div>
    <div
      id="flowContainer"
      class="flow-container"
      :class="{
        grid: gridConfig.showGrid,
        zoomIn: currentTool.type === 'zoom-in',
        zoomOut: currentTool.type === 'zoom-out',
        canScale: container.scaleFlag,
        canDrag: container.dragFlag,
        canMultiple: rectangleMultiple.flag
      }"
      :style="gridStyle"
      @click.stop="containerHandler"
      @mousedown="mousedownHandler"
      @mousemove="mousemoveHandler"
      @mouseup="mouseupHandler"
      @mousewheel="scaleContainer"
      @DOMMouseScroll="scaleContainer"
      @contextmenu="showContainerContextMenu"
      @dblclick.stop="dbClickflowContainer"
    >
      <flow-node
        v-for="node in flowData.nodeList"
        :key="node.id"
        :node="node"
        :plumb="plumb"
        :select.sync="currentSelect"
        :selectGroup.sync="currentSelectGroup"
        :currentTool="currentTool"
        @showNodeContextMenu="showNodeContextMenu($event, node)"
        @showAddMenu="onShowAddMenu"
        @scheduleHideAddMenu="onScheduleHideAddMenu"
        @addNodeFromNode="addNodeFromNode"
        @deleteNode="deleteNode"
        :rectangleMultiple="rectangleMultiple"
        @updateNodePos="updateNodePos"
        @alignForLine="alignForLine"
        @hideAlignLine="hideAlignLine"
        @dbClickNode="dbClickNode"
      >
      </flow-node>
      <div
        class="rectangle-multiple"
        v-if="rectangleMultiple.flag && rectangleMultiple.multipling"
        :style="{
          top: rectangleMultiple.position.top + 'px',
          left: rectangleMultiple.position.left + 'px',
          width: rectangleMultiple.width + 'px',
          height: rectangleMultiple.height + 'px'
        }"
      ></div>
    </div>
    <!-- 添加节点菜单（渲染在画布外，避免 transform 影响，悬停显示） -->
    <div
      v-show="addMenuVisible"
      class="node-add-menu"
      :style="addMenuStyle"
      @mousedown.stop
      @mouseenter="onAddMenuMouseEnter"
      @mouseleave="onAddMenuMouseLeave">
      <div class="node-add-menu-item" @click="onAddNodeMenuClick('ordinary')">
        <a-icon type="right" />
        <span>普通节点</span>
      </div>
      <div class="node-add-menu-item" @click="onAddNodeMenuClick('approval')">
        <a-icon type="form" />
        <span>审批节点</span>
      </div>
      <div class="node-add-menu-item" @click="onAddNodeMenuClick('api')">
        <a-icon type="api" />
        <span>API节点</span>
      </div>
      <div class="node-add-menu-item" @click="onAddNodeMenuClick('dispatch')">
        <a-icon type="apartment" />
        <span>分派节点</span>
      </div>
      <div class="node-add-menu-item" @click="onAddNodeMenuClick('confirmation')">
        <a-icon type="check-circle" />
        <span>确认节点</span>
      </div>
      <div class="node-add-menu-item" @click="onAddNodeMenuClick('judgment')">
        <a-icon type="question-circle" />
        <span>判断节点</span>
      </div>
      <!-- <div class="node-add-menu-item" @click="onAddNodeMenuClick('end')">
        <a-icon type="minus-circle" />
        <span>结束</span>
      </div> -->
    </div>
    <div class="container-scale">
      <a-button shape="circle" size="small" type="default" @click="enlargeContainer">
        <a-icon type="plus" />
      </a-button>
      <span>{{ container.scaleShow }}% </span>
      <a-button shape="circle" size="small" type="default" @click="narrowContainer">
        <a-icon type="minus" />
      </a-button>
    </div>
    <div class="mouse-position">
      x: {{ mouse.position.x }}, y: {{ mouse.position.y }}
    </div>
    <vue-context-menu
      :contextMenuData="containerContextMenuData"
      @flowInfo="flowInfo"
      @previewFlow="previewFlow"
      @selectToolDrag="selectToolDrag"
      @selectToolConnection="selectToolConnection"
      @toggleShowGrid="toggleShowGrid"
      @openViewJson="openViewJson"
      @clear="clear"
      @paste="paste"
      @selectAll="selectAll"
      @publishFlow="publishFlow"
      @shortcutHelper="shortcutHelper"
      @verticaLeft="verticaLeft"
      @verticalCenter="verticalCenter"
      @verticalRight="verticalRight"
      @levelUp="levelUp"
      @levelCenter="levelCenter"
      @levelDown="levelDown"
      @addNodeStart="() => addNodeByType('commonNodes', 'start')"
      @addNodeOrdinary="() => addNodeByType('commonNodes', 'ordinary')"
      @addNodeApproval="() => addNodeByType('commonNodes', 'approval')"
      @addNodeApi="() => addNodeByType('commonNodes', 'api')"
      @addNodeDispatch="() => addNodeByType('commonNodes', 'dispatch')"
      @addNodeConfirmation="() => addNodeByType('commonNodes', 'confirmation')"
      @addNodeJudgment="() => addNodeByType('commonNodes', 'judgment')"
      @addNodeEnd="() => addNodeByType('commonNodes', 'end')"
      @addNodeVirtual="() => addNodeByType('highNodes', 'virtual')"
      @addNodeJob="() => addNodeByType('highNodes', 'job')"
      @addNodeChildFlow="() => addNodeByType('highNodes', 'child_flow')"
      @addNodeXLane="() => addNodeByType('laneNodes', 'x_lane')"
      @addNodeYLane="() => addNodeByType('laneNodes', 'y_lane')"
    >
    </vue-context-menu>
    <vue-context-menu
      :contextMenuData="nodeContextMenuData"
      @setNodeAttr="dbClickNode"
      @addNodeFromNodeOrdinary="() => addNodeFromNode('commonNodes', 'ordinary')"
      @addNodeFromNodeApproval="() => addNodeFromNode('commonNodes', 'approval')"
      @addNodeFromNodeApi="() => addNodeFromNode('commonNodes', 'api')"
      @addNodeFromNodeDispatch="() => addNodeFromNode('commonNodes', 'dispatch')"
      @addNodeFromNodeConfirmation="() => addNodeFromNode('commonNodes', 'confirmation')"
      @addNodeFromNodeJudgment="() => addNodeFromNode('commonNodes', 'judgment')"
      @addNodeFromNodeEnd="() => addNodeFromNode('commonNodes', 'end')"
      @copyNode="copyNode"
      @deleteNode="deleteNode"
    >
    </vue-context-menu>
  </div>
</template>

<script>
  import {flowConfig} from "@/config/flow-config";
  import {deepClone, utils} from "@/utils/common";
  import FlowNode from "./flow-node";
  import { CommonNodeType, HighNodeType, LaneNodeType, ToolsType } from '@/config/type';

  export default {
    props: [
      "browserType",
      "flowData",
      "plumb",
      "select",
      "selectGroup",
      "currentTool",
      "dragInfo",
      "gridConfig"
    ],
    components: {
      FlowNode
    },
    data() {
      return {
        currentSelect: this.select,
        currentSelectGroup: this.selectGroup,
        container: {
          pos: {
            top: 0,
            left: 0
          },
          dragFlag: false,
          draging: false,
          scale: flowConfig.defaultStyle.containerScale.init,
          scaleFlag: false,
          scaleOrigin: {
            x: 0,
            y: 0
          },
          scaleShow: utils.mul(flowConfig.defaultStyle.containerScale.init, 100),
          // 辅助线
          auxiliaryLine: {
            isOpen: flowConfig.defaultStyle.isOpenAuxiliaryLine,
            isShowXLine: false,
            isShowYLine: false,
            controlFnTimesFlag: true
          }
        },
        // 辅助线位置
        auxiliaryLinePos: {
          x: 0,
          y: 0
        },
        mouse: {
          position: {
            x: 0,
            y: 0
          },
          // 鼠标点击起始位置
          tempPos: {
            x: 0,
            y: 0
          }
        },
        // 鼠标划框多选
        rectangleMultiple: {
          flag: false, // 是否按了ctrl键
          multipling: false,
          position: {
            top: 0,
            left: 0
          },
          height: 0,
          width: 0
        },
        containerContextMenuData: flowConfig.contextMenu.container,
        nodeContextMenuData: flowConfig.contextMenu.node,
        nodeMenuListsFull: deepClone(flowConfig.contextMenu.node.menulists),
        // 当前聚焦的连接线ID
        tempLinkId: "",
        // 剪切板内容
        clipboard: [],
        // 添加节点菜单
        addMenuVisible: false,
        addMenuStyle: {},
        addMenuHideTimer: null
      };
    },
    beforeDestroy() {
      this.clearAddMenuHideTimer()
    },
    computed: {
      gridStyle() {
        return {
          top: `${this.container.pos.top}px`,
          left: `${this.container.pos.left}px`,
          transform: `scale(${this.container.scale})`,
          transformOrigin: `${this.container.scaleOrigin.x}px ${this.container.scaleOrigin.y}px`
        };
      }
    },
    methods: {
      // 画布鼠标按下
      mousedownHandler(e) {
        let event = window.event || e;

        if (event.button === 0) {
          if (this.container.dragFlag) {
            this.mouse.tempPos = this.mouse.position;
            this.container.draging = true;
          }

          this.currentSelectGroup = [];
          if (this.rectangleMultiple.flag) {
            this.mouse.tempPos = this.mouse.position;
            this.rectangleMultiple.multipling = true;
          }
        }
      },
      // 画布鼠标移动
      mousemoveHandler(e) {
        let event = window.event || e;

        if (event.target.id === "flowContainer") {
          this.mouse.position = {
            x: event.offsetX,
            y: event.offsetY
          };
        } else {
          let cn = event.target.className;
          let tn = event.target.tagName;
          if (
            cn !== "lane-text" &&
            cn !== "lane-text-div" &&
            tn !== "svg" &&
            tn !== "path" &&
            tn !== "I"
          ) {
            this.mouse.position.x = event.target.offsetLeft + event.offsetX;
            this.mouse.position.y = event.target.offsetTop + event.offsetY;
          }
        }
        if (this.container.draging) {
          let nTop =
            this.container.pos.top +
            (this.mouse.position.y - this.mouse.tempPos.y);
          let nLeft =
            this.container.pos.left +
            (this.mouse.position.x - this.mouse.tempPos.x);
          if (nTop >= 0) nTop = 0;
          if (nLeft >= 0) nLeft = 0;
          this.container.pos = {
            top: nTop,
            left: nLeft
          };
        }
        if (this.rectangleMultiple.multipling) {
          let h = this.mouse.position.y - this.mouse.tempPos.y;
          let w = this.mouse.position.x - this.mouse.tempPos.x;
          let t = this.mouse.tempPos.y;
          let l = this.mouse.tempPos.x;
          if (h >= 0 && w < 0) {
            w = -w;
            l -= w;
          } else if (h < 0 && w >= 0) {
            h = -h;
            t -= h;
          } else if (h < 0 && w < 0) {
            h = -h;
            w = -w;
            t -= h;
            l -= w;
          }
          this.rectangleMultiple.height = h;
          this.rectangleMultiple.width = w;
          this.rectangleMultiple.position.top = t;
          this.rectangleMultiple.position.left = l;
        }
      },
      // 画布鼠标点击松开
      mouseupHandler() {
        if (this.container.draging) this.container.draging = false;
        if (this.rectangleMultiple.multipling) {
          // 鼠标划框内的节点
          this.judgeSelectedNode();
          this.rectangleMultiple.multipling = false;
          this.rectangleMultiple.width = 0;
          this.rectangleMultiple.height = 0;
        }
      },
      // 鼠标划框内的节点
      judgeSelectedNode() {
        let ay = this.rectangleMultiple.position.top;
        let ax = this.rectangleMultiple.position.left;
        let by = ay + this.rectangleMultiple.height;
        let bx = ax + this.rectangleMultiple.width;

        let nodeList = this.flowData.nodeList;
        nodeList.forEach(node => {
          if (node.y >= ay && node.x >= ax && node.y <= by && node.x <= bx) {
            this.plumb.addToDragSelection(node.id);
            this.currentSelectGroup.push(node);
          }
        });
      },
      // 画布鼠标滚轴
      scaleContainer(e) {
        let event = window.event || e;

        if (this.container.scaleFlag) {
          if (this.browserType === 2) {
            if (event.detail < 0) {
              this.enlargeContainer();
            } else {
              this.narrowContainer();
            }
          } else {
            if (event.deltaY < 0) {
              this.enlargeContainer();
            } else if (this.container.scale) {
              this.narrowContainer();
            }
          }
        }
      },
      // 画布放大
      enlargeContainer() {
        this.container.scaleOrigin.x = this.mouse.position.x;
        this.container.scaleOrigin.y = this.mouse.position.y;
        let newScale = utils.add(
          this.container.scale,
          flowConfig.defaultStyle.containerScale.onceEnlarge
        );
        if (newScale <= flowConfig.defaultStyle.containerScale.max) {
          this.container.scale = newScale;
          this.container.scaleShow = utils.mul(this.container.scale, 100);
          this.plumb.setZoom(this.container.scale);
        }
      },
      // 画布缩小
      narrowContainer() {
        this.container.scaleOrigin.x = this.mouse.position.x;
        this.container.scaleOrigin.y = this.mouse.position.y;
        let newScale = utils.sub(
          this.container.scale,
          flowConfig.defaultStyle.containerScale.onceNarrow
        );
        if (newScale >= flowConfig.defaultStyle.containerScale.min) {
          this.container.scale = newScale;
          this.container.scaleShow = utils.mul(this.container.scale, 100);
          this.plumb.setZoom(this.container.scale);
        }
      },
      // 画布右健
      showContainerContextMenu(e) {
        let event = window.event || e;

        event.preventDefault();
        document.querySelector(".vue-contextmenuName-node-menu").style.display =
          "none";
        document.querySelector(".vue-contextmenuName-link-menu").style.display =
          "none";
        this.selectContainer();
        let x = event.clientX;
        let y = event.clientY;
        this.containerContextMenuData.axis = {x, y};
        // 更新鼠标位置，供添加节点使用
        var flowContainer = this.$el.querySelector('#flowContainer');
        if (flowContainer) {
          var rect = flowContainer.getBoundingClientRect();
          this.mouse.position.x = (x - rect.left) / this.container.scale;
          this.mouse.position.y = (y - rect.top) / this.container.scale;
        }
      },
      // 节点右键
      showNodeContextMenu(e, node) {
        let event = window.event || e;

        event.preventDefault();
        document.querySelector(".vue-contextmenuName-flow-menu").style.display =
          "none";
        document.querySelector(".vue-contextmenuName-link-menu").style.display =
          "none";
        let x = event.clientX;
        let y = event.clientY;
        this.nodeContextMenuData.axis = {x, y};
        const isStartOrEnd = node && (node.type === CommonNodeType.START || node.type === CommonNodeType.END);
        this.nodeContextMenuData.menulists = isStartOrEnd
          ? this.nodeMenuListsFull.filter(item => item.fnHandler !== 'copyNode' && item.fnHandler !== 'deleteNode')
          : this.nodeMenuListsFull;
      },
      previewFlow() {
        this.$emit('previewFlow');
      },
      selectToolDrag() {
        this.$emit('selectTool', ToolsType.DRAG);
      },
      selectToolConnection() {
        this.$emit('selectTool', ToolsType.CONNECTION);
      },
      toggleShowGrid() {
        this.$emit('toggleShowGrid');
      },
      openViewJson() {
        this.$emit('openViewJson');
      },
      clear() {
        this.$emit('clear');
      },
      shortcutHelper() {
        this.$emit('shortcutHelper');
      },
      // 流程图信息
      flowInfo() {
        let nodeList = this.flowData.nodeList;
        let linkList = this.flowData.linkList;
        this.$message.info(
          "当前流程图中有 " +
          nodeList.length +
          " 个节点，有 " +
          linkList.length +
          " 条连线。"
        );
      },
      // 粘贴
      paste() {
        let dis = 0;
        this.clipboard.forEach(node => {
          let newNode = Object.assign({}, node);
          newNode.id = utils.getId();
          let nodePos = this.computeNodePos(
            this.mouse.position.x + dis,
            this.mouse.position.y + dis
          );
          newNode.x = nodePos.x;
          newNode.y = nodePos.y;
          dis += 20;
          this.flowData.nodeList.push(newNode);
        });
      },
      // 全选
      selectAll() {
        this.flowData.nodeList.forEach(node => {
          this.plumb.addToDragSelection(node.id);
          this.currentSelectGroup.push(node);
        });
      },
      // 发布流程
      publishFlow() {
        this.$emit("publishFlow");
      },
      // 节点排列前校验节点数量
      checkAlign() {
        if (this.currentSelectGroup.length < 2) {
          this.$message.error("请选择至少两个节点");
          return false;
        }
        return true;
      },
      // 垂直左对齐
      verticaLeft() {
        if (!this.checkAlign()) return;
        let nodeList = this.flowData.nodeList;
        let selectGroup = this.currentSelectGroup;
        let baseX = selectGroup[0].x;
        let baseY = selectGroup[0].y;
        for (let i = 1; i < selectGroup.length; i++) {
          baseY =
            baseY +
            selectGroup[i - 1].height +
            flowConfig.defaultStyle.alignSpacing.vertical;
          let f = nodeList.filter(n => n.id === selectGroup[i].id)[0];
          f.tx = baseX;
          f.ty = baseY;
          this.plumb.animate(
            selectGroup[i].id,
            {top: baseY, left: baseX},
            {
              duration: flowConfig.defaultStyle.alignDuration,
              complete: function () {
                f.x = f.tx;
                f.y = f.ty;
              }
            }
          );
        }
      },
      // 垂直居中
      verticalCenter() {
        if (!this.checkAlign()) return;
        let nodeList = this.flowData.nodeList;
        let selectGroup = this.currentSelectGroup;
        let baseX = selectGroup[0].x;
        let baseY = selectGroup[0].y;
        let firstX = baseX;
        for (let i = 1; i < selectGroup.length; i++) {
          baseY =
            baseY +
            selectGroup[i - 1].height +
            flowConfig.defaultStyle.alignSpacing.vertical;
          baseX =
            firstX +
            utils.div(selectGroup[0].width, 2) -
            utils.div(selectGroup[i].width, 2);
          let f = nodeList.filter(n => n.id === selectGroup[i].id)[0];
          f.tx = baseX;
          f.ty = baseY;
          this.plumb.animate(
            selectGroup[i].id,
            {top: baseY, left: baseX},
            {
              duration: flowConfig.defaultStyle.alignDuration,
              complete: function () {
                f.x = f.tx;
                f.y = f.ty;
              }
            }
          );
        }
      },
      // 垂直右对齐
      verticalRight() {
        if (!this.checkAlign()) return;
        let nodeList = this.flowData.nodeList;
        let selectGroup = this.currentSelectGroup;
        let baseX = selectGroup[0].x;
        let baseY = selectGroup[0].y;
        let firstX = baseX;
        for (let i = 1; i < selectGroup.length; i++) {
          baseY =
            baseY +
            selectGroup[i - 1].height +
            flowConfig.defaultStyle.alignSpacing.vertical;
          baseX = firstX + selectGroup[0].width - selectGroup[i].width;
          let f = nodeList.filter(n => n.id === selectGroup[i].id)[0];
          f.tx = baseX;
          f.ty = baseY;
          this.plumb.animate(
            selectGroup[i].id,
            {top: baseY, left: baseX},
            {
              duration: flowConfig.defaultStyle.alignDuration,
              complete: function () {
                f.x = f.tx;
                f.y = f.ty;
              }
            }
          );
        }
      },
      // 水平上对齐
      levelUp() {
        if (!this.checkAlign()) return;
        let nodeList = this.flowData.nodeList;
        let selectGroup = this.currentSelectGroup;
        let baseX = selectGroup[0].x;
        let baseY = selectGroup[0].y;
        for (let i = 1; i < selectGroup.length; i++) {
          baseX =
            baseX +
            selectGroup[i - 1].width +
            flowConfig.defaultStyle.alignSpacing.level;
          let f = nodeList.filter(n => n.id === selectGroup[i].id)[0];
          f.tx = baseX;
          f.ty = baseY;
          this.plumb.animate(
            selectGroup[i].id,
            {top: baseY, left: baseX},
            {
              duration: flowConfig.defaultStyle.alignDuration,
              complete: function () {
                f.x = f.tx;
                f.y = f.ty;
              }
            }
          );
        }
      },
      // 水平居中
      levelCenter() {
        if (!this.checkAlign()) return;
        let nodeList = this.flowData.nodeList;
        let selectGroup = this.currentSelectGroup;
        let baseX = selectGroup[0].x;
        let baseY = selectGroup[0].y;
        let firstY = baseY;
        for (let i = 1; i < selectGroup.length; i++) {
          baseY =
            firstY +
            utils.div(selectGroup[0].height, 2) -
            utils.div(selectGroup[i].height, 2);
          baseX =
            baseX +
            selectGroup[i - 1].width +
            flowConfig.defaultStyle.alignSpacing.level;
          let f = nodeList.filter(n => n.id === selectGroup[i].id)[0];
          f.tx = baseX;
          f.ty = baseY;
          this.plumb.animate(
            selectGroup[i].id,
            {top: baseY, left: baseX},
            {
              duration: flowConfig.defaultStyle.alignDuration,
              complete: function () {
                f.x = f.tx;
                f.y = f.ty;
              }
            }
          );
        }
      },
      // 水平下对齐
      levelDown() {
        if (!this.checkAlign()) return;
        let nodeList = this.flowData.nodeList;
        let selectGroup = this.currentSelectGroup;
        let baseX = selectGroup[0].x;
        let baseY = selectGroup[0].y;
        let firstY = baseY;
        for (let i = 1; i < selectGroup.length; i++) {
          baseY = firstY + selectGroup[0].height - selectGroup[i].height;
          baseX =
            baseX +
            selectGroup[i - 1].width +
            flowConfig.defaultStyle.alignSpacing.level;
          let f = nodeList.filter(n => n.id === selectGroup[i].id)[0];
          f.tx = baseX;
          f.ty = baseY;
          this.plumb.animate(
            selectGroup[i].id,
            {top: baseY, left: baseX},
            {
              duration: flowConfig.defaultStyle.alignDuration,
              complete: function () {
                f.x = f.tx;
                f.y = f.ty;
              }
            }
          );
        }
      },
      // 复制节点
      copyNode() {
        this.clipboard = [];
        if (this.currentSelectGroup.length > 0) {
          this.clipboard = Object.assign([],deepClone(this.currentSelectGroup));
        } else if (this.currentSelect.id) {
          this.clipboard.push(deepClone(this.currentSelect));
        }
      },
      // 查询删除节点关联的连接线
      getConnectionsByNodeId(nodeId) {
        let conns1 = this.plumb.getConnections({
          source: nodeId
        });
        let conns2 = this.plumb.getConnections({
          target: nodeId
        });
        return conns1.concat(conns2);
      },
      // 删除节点（删除后重新连接前后节点）
      deleteNode() {
        const nodeList = this.flowData.nodeList;
        const linkList = this.flowData.linkList;
        const deletedNode = this.currentSelect;
        if (!deletedNode || !deletedNode.id) return;

        this.flowData.status = flowConfig.flowStatus.LOADING;

        const conns = this.getConnectionsByNodeId(deletedNode.id);
        const incomingConns = conns.filter(c => c.targetId === deletedNode.id);
        const outgoingConns = conns.filter(c => c.sourceId === deletedNode.id);

        // 收集需要新建的连线：每个前驱节点连到每个后继节点
        const newConnections = [];
        incomingConns.forEach(inConn => {
          outgoingConns.forEach(outConn => {
            const sourceId = inConn.sourceId;
            const targetId = outConn.targetId;
            if (sourceId !== targetId && !linkList.some(l => l.sourceId === sourceId && l.targetId === targetId)) {
              newConnections.push({ sourceId, targetId });
            }
          });
        });

        // 在删除前保存连线样式
        const existingLink = (incomingConns[0] && linkList.find(l => l.sourceId === incomingConns[0].sourceId && l.targetId === deletedNode.id))
          || (outgoingConns[0] && linkList.find(l => l.sourceId === deletedNode.id && l.targetId === outgoingConns[0].targetId));
        const attrsTemplate = existingLink && existingLink.attrs
          ? { ...existingLink.attrs }
          : { connectorType: 'Straight', stroke: '#2a2929', strokeWidth: 1 };

        // 删除与该节点相关的所有连线
        conns.forEach(conn => {
          const linkIdx = linkList.findIndex(l => l.sourceId === conn.sourceId && l.targetId === conn.targetId);
          if (linkIdx >= 0) linkList.splice(linkIdx, 1);
          const plumbConns = this.plumb.getConnections({ source: conn.sourceId, target: conn.targetId });
          if (plumbConns[0]) this.plumb.deleteConnection(plumbConns[0]);
          this.$emit('upOrDownNodeJobs', conn.sourceId, conn.targetId, false);
        });

        this.$nextTick(() => {
          newConnections.forEach(({ sourceId, targetId }) => {
            this.plumb.connect({
              source: sourceId,
              target: targetId,
              connector: 'Straight',
              anchors: ['Bottom', 'Top']
            });
            const link = linkList.filter(l => l.sourceId === sourceId && l.targetId === targetId)[0];
            if (link) {
              if (!link.attrs) link.attrs = {};
              Object.assign(link.attrs, attrsTemplate);
            }
            this.$emit('upOrDownNodeJobs', sourceId, targetId, true);
          });

          // 删除节点
          const nodeIdx = nodeList.findIndex(n => n.id === deletedNode.id);
          if (nodeIdx >= 0) nodeList.splice(nodeIdx, 1);

          // 上移后继节点，填补删除产生的空隙
          const gap = 10;
          const pullUpAmount = deletedNode.height + gap;
          const deletedBottom = deletedNode.y + deletedNode.height;
          nodeList.forEach(n => {
            if (n.y >= deletedBottom) n.y -= pullUpAmount;
          });

          this.$nextTick(() => this.plumb.repaintEverything());
        });

        this.flowData.status = flowConfig.flowStatus.CREATE;
        this.selectContainer();
      },
      // 通过右键菜单添加节点
      addNodeByType(belongTo, type) {
        this.$emit("findNodeConfig", belongTo, type, function(node) {
          if (!node) {
            this.$message.error("未知的节点类型");
            return;
          }
          this.addNewNode(node);
        }.bind(this));
      },
      // 显示添加节点菜单（悬停加号触发）
      onShowAddMenu({ visible, left, top }) {
        this.clearAddMenuHideTimer()
        this.addMenuVisible = visible
        this.addMenuStyle = {
          position: 'fixed',
          left: left + 'px',
          top: top + 'px',
          zIndex: 9999
        }
      },
      // 延迟隐藏菜单（鼠标移出加号或菜单时）
      onScheduleHideAddMenu() {
        this.clearAddMenuHideTimer()
        this.addMenuHideTimer = setTimeout(() => {
          this.addMenuVisible = false
          this.addMenuHideTimer = null
        }, 150)
      },
      onAddMenuMouseEnter() {
        this.clearAddMenuHideTimer()
      },
      onAddMenuMouseLeave() {
        this.onScheduleHideAddMenu()
      },
      clearAddMenuHideTimer() {
        if (this.addMenuHideTimer) {
          clearTimeout(this.addMenuHideTimer)
          this.addMenuHideTimer = null
        }
      },
      closeAddMenu() {
        this.addMenuVisible = false
        this.clearAddMenuHideTimer()
      },
      // 点击添加节点菜单项
      onAddNodeMenuClick(key) {
        const map = {
          ordinary: ['commonNodes', 'ordinary'],
          approval: ['commonNodes', 'approval'],
          api: ['commonNodes', 'api'],
          dispatch: ['commonNodes', 'dispatch'],
          confirmation: ['commonNodes', 'confirmation'],
          judgment: ['commonNodes', 'judgment'],
          end: ['commonNodes', 'end']
        }
        const [belongTo, type] = map[key] || []
        if (belongTo && type) this.addNodeFromNode(belongTo, type)
        this.closeAddMenu()
      },
      // 在节点下方添加新节点并连线（插入到流程中）
      addNodeFromNode(belongTo, type) {
        const sourceNode = this.currentSelect;
        if (!sourceNode || !sourceNode.id) {
          this.$message.warning("请先选择节点");
          return;
        }
        if (type === 'judgment') {
          this.addJudgmentNode(sourceNode);
          return;
        }
        this.$emit("findNodeConfig", belongTo, type, function(node) {
          if (!node) {
            this.$message.error("未知的节点类型");
            return;
          }
          const gap = 10;
          const nodeList = this.flowData.nodeList;
          const linkList = this.flowData.linkList;

          const newNode = Object.assign({}, node);
          newNode.id = utils.getId();
          newNode.icon = null;
          const isJudgmentSource = sourceNode.type === CommonNodeType.JUDGMENT;
          const sourceW = sourceNode.width || 70;
          const sourceH = sourceNode.height || 70;

          if (newNode.type === CommonNodeType.START || newNode.type === CommonNodeType.END) {
            newNode.height = 50;
            newNode.width = 50;
          } else if (newNode.type === CommonNodeType.JUDGMENT) {
            newNode.height = 70;
            newNode.width = 70;
          } else {
            newNode.height = 50;
            newNode.width = 120;
          }

          if (isJudgmentSource) {
            newNode.x = sourceNode.x + sourceW + gap;
            newNode.y = sourceNode.y + (sourceH - (newNode.height || 50)) / 2;
          } else if (newNode.type === CommonNodeType.START || newNode.type === CommonNodeType.END) {
            newNode.x = sourceNode.x + (sourceW - 50) / 2;
            newNode.y = sourceNode.y + sourceH + gap;
          } else {
            newNode.x = sourceNode.x + (sourceW - (newNode.width || 120)) / 2;
            newNode.y = sourceNode.y + sourceH + gap;
          }

          const outConns = this.plumb.getConnections({ source: sourceNode.id });
          let oldTargetId = null;

          if (!isJudgmentSource && outConns.length === 1) {
            oldTargetId = outConns[0].targetId;
            const oldTarget = nodeList.find(n => n.id === oldTargetId);
            this.plumb.deleteConnection(outConns[0]);
            const linkIdx = linkList.findIndex(
              l => l.sourceId === sourceNode.id && l.targetId === oldTargetId
            );
            if (linkIdx >= 0) linkList.splice(linkIdx, 1);
            this.$emit('upOrDownNodeJobs', sourceNode.id, oldTargetId, false);

            if (oldTarget) {
              const targetNewY = newNode.y + newNode.height + gap;
              const pushDownAmount = targetNewY - oldTarget.y;
              const sourceBottom = sourceNode.y + sourceNode.height;
              nodeList.forEach(n => {
                if (n.id !== newNode.id && n.y >= sourceBottom) n.y += pushDownAmount;
              });
            }
          }

          nodeList.push(newNode);

          this.$nextTick(() => {
            const anchors = isJudgmentSource ? ['Right', 'Left'] : ['Bottom', 'Top'];
            this.plumb.connect({
              source: sourceNode.id,
              target: newNode.id,
              connector: 'Straight',
              anchors
            });
            let link = linkList.filter(
              l => l.sourceId === sourceNode.id && l.targetId === newNode.id
            )[0];
            if (link && !link.attrs) link.attrs = {};
            if (link) link.attrs.connectorType = 'Straight';
            this.$emit('upOrDownNodeJobs', sourceNode.id, newNode.id, true);

            if (!isJudgmentSource && outConns.length === 1 && oldTargetId) {
              this.plumb.connect({
                source: newNode.id,
                target: oldTargetId,
                connector: 'Straight',
                anchors: ['Bottom', 'Top']
              });
              link = linkList.filter(
                l => l.sourceId === newNode.id && l.targetId === oldTargetId
              )[0];
              if (link && !link.attrs) link.attrs = {};
              if (link) link.attrs.connectorType = 'Straight';
              this.$emit('upOrDownNodeJobs', newNode.id, oldTargetId, true);
            }

            this.$nextTick(() => {
              this.plumb.repaintEverything();
            });
          });
        }.bind(this));
      },
      // 添加判断节点：两条分支，一条接原流程，一条接默认节点再接到结束
      addJudgmentNode(sourceNode) {
        this.$emit("findNodeConfig", "commonNodes", "judgment", (judgmentNode) => {
          if (!judgmentNode) {
            this.$message.error("未知的节点类型");
            return;
          }
          this.$emit("findNodeConfig", "commonNodes", "ordinary", (branchNode) => {
            if (!branchNode) {
              this.$message.error("获取默认节点失败");
              return;
            }
            const gap = 10;
            const nodeList = this.flowData.nodeList;
            const linkList = this.flowData.linkList;
            const outConns = this.plumb.getConnections({ source: sourceNode.id });

            if (outConns.length !== 1) {
              this.$message.warning("请从只有一个出线的节点添加判断节点");
              return;
            }

            const oldTargetId = outConns[0].targetId;
            const oldTarget = nodeList.find(n => n.id === oldTargetId);
            let endNode = nodeList.find(n => n.type === CommonNodeType.END);

            this.plumb.deleteConnection(outConns[0]);
            const linkIdx = linkList.findIndex(
              l => l.sourceId === sourceNode.id && l.targetId === oldTargetId
            );
            if (linkIdx >= 0) linkList.splice(linkIdx, 1);
            this.$emit('upOrDownNodeJobs', sourceNode.id, oldTargetId, false);

            const sourceW = sourceNode.width || 120;
            const sourceH = sourceNode.height || 50;

            const judgment = Object.assign({}, judgmentNode);
            judgment.id = utils.getId();
            judgment.icon = null;
            judgment.width = 70;
            judgment.height = 70;
            judgment.x = sourceNode.x + (sourceW - 70) / 2;
            judgment.y = sourceNode.y + sourceH + gap;

            const branch = Object.assign({}, branchNode);
            branch.id = utils.getId();
            branch.icon = null;
            branch.width = 120;
            branch.height = 50
            branch.nodeName = '普通节点';
            branch.x = judgment.x + 70 + gap;
            branch.y = judgment.y + (70 - 50) / 2;

            const finishAdd = () => {
              const sourceBottom = sourceNode.y + sourceH;
              const judgmentBottom = judgment.y + 70;
              const needY = judgmentBottom + gap;

              if (oldTarget && oldTarget.y < needY) {
                const pushDown = needY - oldTarget.y;
                nodeList.forEach(n => {
                  if (n.id !== judgment.id && n.id !== branch.id && n.y >= oldTarget.y) n.y += pushDown;
                });
              }

              nodeList.push(judgment);
              nodeList.push(branch);
              if (endNode && !nodeList.includes(endNode)) nodeList.push(endNode);

              this.$nextTick(() => {
                this.plumb.connect({
                  source: sourceNode.id,
                  target: judgment.id,
                  connector: 'Straight',
                  anchors: ['Bottom', 'Top']
                });
                this.plumb.connect({
                  source: judgment.id,
                  target: oldTargetId,
                  connector: 'Straight',
                  anchors: ['Bottom', 'Top']
                });
                this.plumb.connect({
                  source: judgment.id,
                  target: branch.id,
                  connector: 'Straight',
                  anchors: ['Right', 'Left']
                });
                this.plumb.connect({
                  source: branch.id,
                  target: endNode.id,
                  connector: 'Straight',
                  anchors: ['Bottom', 'Top']
                });

                linkList.forEach(l => {
                  if (!l.attrs) l.attrs = {};
                  if ((l.sourceId === sourceNode.id && l.targetId === judgment.id) ||
                      (l.sourceId === judgment.id && l.targetId === oldTargetId) ||
                      (l.sourceId === judgment.id && l.targetId === branch.id) ||
                      (l.sourceId === branch.id && l.targetId === endNode.id)) {
                    l.attrs.connectorType = 'Straight';
                  }
                });
                this.$emit('upOrDownNodeJobs', sourceNode.id, judgment.id, true);
                this.$emit('upOrDownNodeJobs', judgment.id, oldTargetId, true);
                this.$emit('upOrDownNodeJobs', judgment.id, branch.id, true);
                this.$emit('upOrDownNodeJobs', branch.id, endNode.id, true);

                this.$nextTick(() => this.plumb.repaintEverything());
              });
            };

            if (!endNode) {
              this.$emit("findNodeConfig", "commonNodes", "end", (endNodeConfig) => {
                if (!endNodeConfig) return;
                endNode = Object.assign({}, endNodeConfig);
                endNode.id = utils.getId();
                endNode.icon = null;
                endNode.width = 50;
                endNode.height = 50;
                const maxY = Math.max(judgment.y + 70, branch.y + 50, ...nodeList.map(n => n.y + (n.height || 50)));
                endNode.x = branch.x + (120 - 50) / 2;
                endNode.y = maxY + gap;
                finishAdd();
              });
            } else {
              finishAdd();
            }
          });
        });
      },
      // 增加画布节点
      addNewNode(node) {
        let x = this.mouse.position.x;
        let y = this.mouse.position.y;
        let nodePos = this.computeNodePos(x, y);
        x = nodePos.x;
        y = nodePos.y;

        let newNode = Object.assign({}, node);
        newNode.id = utils.getId();
        if (
          newNode.type === CommonNodeType.START ||
          newNode.type === CommonNodeType.END
        ) {
          newNode.height = 50;
          newNode.width = 50;
          newNode.x = x - 25;
          newNode.y = y - 25;
        } else if (newNode.type === CommonNodeType.JUDGMENT) {
          newNode.height = 70;
          newNode.width = 70;
          newNode.x = x - 35;
          newNode.y = y - 35;
        } else {
          newNode.height = 50;
          newNode.width = 120;
          newNode.x = x - 60;
          newNode.y = y - 25;
        }
        if (newNode.type === LaneNodeType.X_LANE) {
          newNode.height = 200;
          newNode.width = 500;
        } else if (newNode.type === LaneNodeType.Y_LANE) {
          newNode.height = 500;
          newNode.width = 200;
        }
        this.flowData.nodeList.push(newNode);
      },
      // x, y取整计算
      computeNodePos(x, y) {
        const pxx = flowConfig.defaultStyle.alignGridPX[0];
        const pxy = flowConfig.defaultStyle.alignGridPX[1];
        if (x % pxx) x = pxx - (x % pxx) + x;
        if (y % pxy) y = pxy - (y % pxy) + y;
        return {
          x: x,
          y: y
        };
      },
      // 点击画布
      containerHandler() {
        this.selectContainer();
      },
      // 双击画布
      dbClickflowContainer() {
        if (this.currentTool.type !== ToolsType.DRAG) {
          this.$emit("selectTool", ToolsType.DRAG);
        } else {
          this.$emit("selectTool", ToolsType.CONNECTION);
        }
      },
      // 清除面布
      selectContainer() {
        this.currentSelect = {};
        // 开启快捷键
        this.$emit("getShortcut");
      },
      // 双击节点
      dbClickNode() {
        if (this.rectangleMultiple.flag === false) {
          let attrConfigVisible = Object.keys(this.currentSelect).length !== 0
          if (attrConfigVisible) this.$emit("showAttrConfig", true);
        }
      },
      // 更新组节点信息
      updateNodePos() {
        let nodeList = this.flowData.nodeList;
        this.currentSelectGroup.forEach(node => {
          let element = document.getElementById(node.id);
          let l = parseInt(element.style.left);
          let t = parseInt(element.style.top);
          let f = nodeList.filter(n => n.id === node.id)[0];
          f.x = l;
          f.y = t;
        });
      },
      // 计算辅助线
      alignForLine(e) {
        if (this.selectGroup.length > 1) return;
        if (this.container.auxiliaryLine.controlFnTimesFlag) {
          let elId = e.el.id;
          let nodeList = this.flowData.nodeList;
          nodeList.forEach(node => {
            if (elId !== node.id) {
              let dis = flowConfig.defaultStyle.showAuxiliaryLineDistance,
                elPos = e.pos,
                elH = e.el.offsetHeight,
                elW = e.el.offsetWidth,
                disX = elPos[0] - node.x,
                disY = elPos[1] - node.y;
              if (
                (disX >= -dis && disX <= dis) ||
                (disX + elW >= -dis && disX + elW <= dis)
              ) {
                this.container.auxiliaryLine.isShowYLine = true;
                this.auxiliaryLinePos.x = node.x + this.container.pos.left;
                let nodeMidPointX = node.x + node.width / 2;
                if (nodeMidPointX === elPos[0] + elW / 2) {
                  this.auxiliaryLinePos.x =
                    nodeMidPointX + this.container.pos.left;
                }
              }
              if (
                (disY >= -dis && disY <= dis) ||
                (disY + elH >= -dis && disY + elH <= dis)
              ) {
                this.container.auxiliaryLine.isShowXLine = true;
                this.auxiliaryLinePos.y = node.y + this.container.pos.top;
                let nodeMidPointY = node.y + node.height / 2;
                if (nodeMidPointY === elPos[1] + elH / 2) {
                  this.auxiliaryLinePos.y =
                    nodeMidPointY + this.container.pos.left;
                }
              }
            }
          });
          this.container.auxiliaryLine.controlFnTimesFlag = false;
          setTimeout(() => {
            this.container.auxiliaryLine.controlFnTimesFlag = true;
          }, 200);
        }
      },
      // 隐藏辅助线
      hideAlignLine() {
        if (this.container.auxiliaryLine.isOpen) {
          this.container.auxiliaryLine.isShowXLine = false;
          this.container.auxiliaryLine.isShowYLine = false;
        }
      }
    },
    watch: {
      select(val) {
        this.currentSelect = val;
        // 清除连接线焦点
        if (this.tempLinkId !== "") {
          let element = document.getElementById(this.tempLinkId);
          if (element) {// jsplumb会自动删除svg
            element.classList.remove("link-active");
          }
          this.tempLinkId = "";
        }
        // 设置连接线焦点
        if (this.currentSelect.type === CommonNodeType.LINK) {
          this.tempLinkId = this.currentSelect.id;
          document.getElementById(this.currentSelect.id)
            .classList.add("link-active");
        }
      },
      currentSelect: {
        handler(val) {
          this.$emit("update:select", val);
        },
        deep: true
      },
      selectGroup(val) {
        this.currentSelectGroup = val;
        if (this.currentSelectGroup.length <= 0) this.plumb.clearDragSelection();
      },
      currentSelectGroup: {
        handler(val) {
          this.$emit("update:selectGroup", val);
        },
        deep: true
      }
    }
  };
</script>

<style lang="less">
  @import "../assets/style/flow-area.less";
</style>
