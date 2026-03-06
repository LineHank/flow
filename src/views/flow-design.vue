<template>
  <div style="height: 100%;">
    <a-layout class="container">
      <a-layout>
        <a-layout-header class="header-option">
          <div class="header-option__tools">
            <span v-for="tool in field.tools" :key="tool.type">
              <a-tooltip :title="tool.name" placement="right">
                <a-button
                  size="small"
                  :type="currentTool.type === tool.type ? 'primary' : 'default'"
                  @click="selectTool(tool.type)"
                >
                  <a-icon :type="tool.icon" />
                </a-button>
              </a-tooltip>
            </span>
          </div>
          <div class="header-option__buttons">
            <a-tooltip title="预览" placement="bottom">
              <a-button
                @click="previewFlow"
                class="header-option-button"
              >
                <a-icon type="eye" />
              </a-button>
            </a-tooltip>
            <a-tooltip title="发布" placement="bottom">
              <a-button
                @click="publishFlow"
                class="header-option-button"
              >
                <a-icon type="send" />
              </a-button>
            </a-tooltip>
            <a-tooltip title="重新绘制" placement="bottom">
              <a-popconfirm
                title="是否确认重新绘制?"
                @confirm="clear"
              >
                <a-button
                  class="header-option-button"
                >
                  <a-icon type="delete" />
                </a-button>
              </a-popconfirm>
            </a-tooltip>
            <a-tooltip :title="gridConfig.showGridText" placement="bottom">
              <a-button
                @click="toggleShowGrid"
                class="header-option-button"
              >
                <a-icon :type="gridConfig.showGridIcon" />
              </a-button>
            </a-tooltip>
            <a-tooltip title="设置" placement="bottom">
              <a-button
                @click="setting"
                class="header-option-button"
              >
                <a-icon type="setting" />
              </a-button>
            </a-tooltip>
            <a-tooltip title="查看" placement="bottom">
              <a-button
                @click="openViewJson"
                class="header-option-button"
              >
                <a-icon type="search" />
              </a-button>
            </a-tooltip>
            <a-tooltip title="退出" placement="bottom">
              <a-button
                @click="exitFlow"
                class="header-option-button"
              >
                <a-icon type="close" />
              </a-button>
            </a-tooltip>
            <a-tooltip title="查看快捷键或文档" placement="bottom">
              <a-popconfirm
                title="快速入门："
                placement="bottom"
                okText="使用文档"
                cancelText="快捷键"
                @confirm="usingDoc"
                @cancel="shortcutHelper"
              >
                <a-button
                  style="color: #409EFF;font-size: 12px"
                  class="header-option-button"
                >
                  <a-icon type="question-circle" />
                  快速入门
                </a-button>
              </a-popconfirm>
            </a-tooltip>
          </div>
        </a-layout-header>
        <a-layout-content class="content">
          <flow-area
            ref="flowArea"
            :browserType="browserType"
            :flowData="flowData"
            :gridConfig="gridConfig"
            :select.sync="currentSelect"
            :selectGroup.sync="currentSelectGroup"
            :plumb="plumb"
            :currentTool="currentTool"
            @findNodeConfig="findNodeConfig"
            @selectTool="selectTool"
            @getShortcut="getShortcut"
            @publishFlow="publishFlow"
            @showAttrConfig="showAttrConfig"
            @upOrDownNodeJobs="upOrDownNodeJobs"
          >
          </flow-area>
          <vue-context-menu
            :contextMenuData="linkContextMenuData"
            @deleteLink="deleteLink"
            @setLinkAttr="showAttrConfig(true)"
          >
          </vue-context-menu>
        </a-layout-content>
      </a-layout>
      <a-drawer
        class="flow-drawer"
        title="属性配置(注:可双击节点或连线设置)"
        placement="right"
        :width="500"
        :visible="attrConfigVisible"
        @close="attrConfigVisible = false"
      >
        <flow-attr
          ref="flowAttr"
          :plumb="plumb"
          :flowData="flowData"
          :select.sync="currentSelect"
          @mousedown.stop="loseShortcut"
          @showAttrConfig="showAttrConfig"
          @loadFlow="loadFlow"
        ></flow-attr>
      </a-drawer>
    </a-layout>
    <!-- 预览流程 -->
    <a-modal
      :title="'流程设计图_' + flowData.attrs.id + '.png'"
      :visible="flowPicture.modalVisible"
      :closable="flowPicture.closable"
      :maskClosable="flowPicture.maskClosable"
      width="90%"
      @cancel="cancelPreviewFlow"
    >
      <img :src="flowPicture.url" style="width: 100%"/>
      <template slot="footer">
        <a-button @click="cancelPreviewFlow">取 消</a-button>
        <a-button type="primary" @click="downLoadFlowPicture">下 载</a-button>
        <a-button type="primary" @click="upLoadFlowPicture">上传到服务器</a-button>
      </template>
    </a-modal>
    <!-- 设置 -->
    <setting-modal ref="settingModal"></setting-modal>
    <!-- 快捷键 -->
    <shortcut-modal ref="shortcutModal"></shortcut-modal>
    <!-- 查看数据 -->
    <json-modal ref="jsonModal" @loadFlow="loadFlow"></json-modal>
  </div>
</template>

<script>
  import {jsPlumb} from "jsplumb";
  import {commonNodes, highNodes, laneNodes, tools} from "@/config/node-config";
  import {flowConfig} from "@/config/flow-config";
  import html2canvas from "html2canvas";
  import canvg from "canvg";
  import {deepClone, utils, getBrowserType} from "@/utils/common";
  import FlowArea from "../components/flow-area";
  import FlowAttr from "../components/flow-attr";
  import SettingModal from "./setting";
  import ShortcutModal from "./shortcut";
  import JsonModal from "./json-view";
  import {ToolsType, LaneNodeType, CommonNodeType, HighNodeType} from "@/config/type";
  import * as defFlow from '@/api/flow'
  import {setStore} from "@/utils/store";

  export default {
    name: "flowDesign",
    components: {
      flowConfig,
      html2canvas,
      canvg,
      FlowArea,
      FlowAttr,
      SettingModal,
      ShortcutModal,
      JsonModal
    },
    mounted() {
      // 浏览器兼容性
      this.dealCompatibility();
      // 实例化JsPlumb
      this.initJsPlumb();
      // 初始化快捷键
      this.listenShortcut();
      // 初始化流程图
      this.initFlow();
      // 关闭提示
      this.listenPage();
    },
    data() {
      return {
        browserType: 3,
        plumb: {},
        field: {
          tools: tools,
          commonNodes: commonNodes,
          highNodes: highNodes,
          laneNodes: laneNodes
        },
        flowData: flowConfig.flowData,
        gridConfig: flowConfig.gridConfig,
        currentTool: {
          type: ToolsType.DRAG,
          icon: "drag",
          name: "拖拽"
        },
        currentSelect: {},
        currentSelectGroup: [],
        activeShortcut: true, // 画布聚焦开启快捷键
        linkContextMenuData: flowConfig.contextMenu.link,
        flowPicture: {
          url: "",
          modalVisible: false,
          closable: false,
          maskClosable: false
        },
        attrConfigVisible: false
      };
    },
    methods: {
      // 浏览器兼容性
      dealCompatibility() {
        this.browserType = getBrowserType(this);
        if (this.browserType === 2) {
          flowConfig.shortcut.scaleContainer = {
            code: 16,
            codeName: "SHIFT(chrome下为ALT)",
            shortcutName: "画布缩放"
          };
        }
      },
      // 实例化JsPlumb
      initJsPlumb() {
        this.plumb = jsPlumb.getInstance(flowConfig.jsPlumbInsConfig);
        window._plumb = this.plumb;

        this.plumb.bind("beforeDrop", info => {
          let sourceId = info.sourceId;
          let targetId = info.targetId;

          if (sourceId === targetId) return false;
          let filter = this.flowData.linkList.filter(
            link => link.sourceId === sourceId && link.targetId === targetId
          );
          if (filter.length > 0) {
            this.$message.error("同方向的两节点连线只能有一条");
            return false;
          }
          return true;
        });

        this.plumb.bind("connection", conn => {
          let connObj = conn.connection.canvas;
          let o = deepClone(commonNodes.filter(n => n.type === CommonNodeType.LINK)[0]),
            id,
            label;
          o.id = null
          o.icon = null
          if (
            this.flowData.status === flowConfig.flowStatus.CREATE ||
            this.flowData.status === flowConfig.flowStatus.MODIFY
          ) {
            id = utils.getId();
            label = "";
          } else if (this.flowData.status === flowConfig.flowStatus.LOADING) {
            let l = this.flowData.linkList[this.flowData.linkList.length - 1];
            id = l.id;
            label = l.label;
          }
          connObj.id = id;
          o.id = id;
          o.sourceId = conn.sourceId;
          o.targetId = conn.targetId;
          o.label = label;

          let _this = this
          let element = document.getElementById(id);
          element.addEventListener("contextmenu", e => {
            _this.showLinkContextMenu(e);
            _this.currentSelect = _this.flowData.linkList.filter(
              l => l.id === id
            )[0];
          });

          element.addEventListener("click", e => {
            let event = window.event || e;
            event.stopPropagation();
            _this.currentSelect = _this.flowData.linkList.filter(
              l => l.id === id
            )[0];
          });

          element.addEventListener("dblclick", e => {
            let event = window.event || e;
            event.stopPropagation();
            _this.showAttrConfig(true)
          });

          if (this.flowData.status !== flowConfig.flowStatus.LOADING) {
            this.flowData.linkList.push(o);
            // 增加节点任务数
            this.upOrDownNodeJobs(o.sourceId, o.targetId, true)
          }

        });

        this.plumb.importDefaults({
          ConnectionsDetachable: flowConfig.jsPlumbConfig.conn.isDetachable
        });
      },
      // 初始化快捷键
      listenShortcut() {
        document.onkeydown = e => {
          let event = window.event || e;

          // 画布聚焦开启快捷键
          if (!this.activeShortcut) return;
          let key = event.keyCode;

          switch (key) {
            case flowConfig.shortcut.multiple.code:
              this.$refs.flowArea.rectangleMultiple.flag = true;
              break;
            case flowConfig.shortcut.dragContainer.code:
              this.$refs.flowArea.container.dragFlag = true;
              break;
            case flowConfig.shortcut.scaleContainer.code:
              this.$refs.flowArea.container.scaleFlag = true;
              break;
            case flowConfig.shortcut.dragTool.code:
              this.selectTool(ToolsType.DRAG);
              break;
            case flowConfig.shortcut.connTool.code:
              this.selectTool(ToolsType.CONNECTION);
              break;
            case flowConfig.shortcut.leftMove.code:
              this.moveNode("left");
              break;
            case flowConfig.shortcut.upMove.code:
              this.moveNode("up");
              break;
            case flowConfig.shortcut.rightMove.code:
              this.moveNode("right");
              break;
            case flowConfig.shortcut.downMove.code:
              this.moveNode("down");
              break;
          }

          if (event.ctrlKey) {
            if (event.altKey) {
              switch (key) {
                case flowConfig.shortcut.settingModal.code:
                  this.setting();
                  break;
                case flowConfig.shortcut.jsonModal.code:
                  this.openViewJson();
                  break;
              }
            }
          }
        };
        // 拖拽、缩放、多选快捷键复位
        document.onkeyup = e => {
          let event = window.event || e;

          let key = event.keyCode;
          if (key === flowConfig.shortcut.dragContainer.code) {
            this.$refs.flowArea.container.dragFlag = false;
          } else if (key === flowConfig.shortcut.scaleContainer.code) {
            event.preventDefault();
            this.$refs.flowArea.container.scaleFlag = false;
          } else if (key === flowConfig.shortcut.multiple.code) {
            this.$refs.flowArea.rectangleMultiple.flag = false;
          }
        };
      },
      // 关闭提示
      listenPage() {
        window.onbeforeunload = function (e) {
          e = e || window.event;
          if (e) {
            e.returnValue = "关闭提示";
          }
          return "关闭提示";
        };
      },
      // 初始化流程图
      initFlow() {
        if (this.flowData.status === flowConfig.flowStatus.CREATE) {
          this.flowData.attrs.id = utils.getId();
        } else {
          this.loadFlow();
        }
      },
      // 渲染流程
      loadFlow(json) {
        this.clear();
        this.$nextTick(() => {
          let loadData = JSON.parse(json);
          this.flowData.attrs = loadData.attrs;
          this.flowData.status = flowConfig.flowStatus.LOADING;
          this.plumb.batch(() => {
            let nodeList = loadData.nodeList;
            nodeList.forEach(node => {
              this.flowData.nodeList.push(node);
            });
            let linkList = loadData.linkList;
            this.$nextTick(() => {
              linkList.forEach(link => {
                this.flowData.linkList.push(link);
                let conn = this.plumb.connect({
                  source: link.sourceId,
                  target: link.targetId,
                  connector: flowConfig.jsPlumbInsConfig.Connector,
                  anchor: flowConfig.jsPlumbConfig.anchor.default,
                  paintStyle: flowConfig.jsPlumbInsConfig.PaintStyle
                });
                let link_id = conn.canvas.id;
                let labelHandle = e => {
                  let event = window.event || e;
                  event.stopPropagation();
                  this.currentSelect = this.flowData.linkList.filter(
                    l => l.id === link_id
                  )[0];
                };

                if (link.label !== "") {
                  conn.setLabel({
                    label: link.label,
                    cssClass: `link-label ${link_id}`
                  });
                  // 添加label点击事件
                  document.getElementsByClassName(link_id)[0].addEventListener("click", labelHandle);
                } else {
                  let elementsByClassName = document.getElementsByClassName(link_id)[0];
                  if (elementsByClassName) {
                    // 移除label点击事件
                    elementsByClassName.removeEventListener("click", labelHandle);
                  }
                }
              });
              this.currentSelect = {};
              this.currentSelectGroup = [];
              this.flowData.status = flowConfig.flowStatus.MODIFY;
            });
          }, true);

          if (!this.checkFlow()) return;
          let canvasSize = this.computeCanvasSize();
          this.$refs.flowArea.container.pos = {
            top: -canvasSize.minY + 100,
            left: -canvasSize.minX + 100
          };
          // 生成流程图
          /*setTimeout(() => {
            this.previewFlow()
          }, 2000)*/
        });
      },
      // 查找相关节点
      findNodeConfig(belongTo, type, callback) {
        let node = null;
        switch (belongTo) {
          case "commonNodes":
            node = deepClone(commonNodes.filter(n => n.type === type));
            break;
          case "highNodes":
            node = deepClone(highNodes.filter(n => n.type === type));
            break;
          case "laneNodes":
            node = deepClone(laneNodes.filter(n => n.type === type));
            break;
        }
        if (node && node.length >= 0) {
          node = node[0];
          node.icon = null
        }
        callback(node);
      },
      // 设置工具
      selectTool(type) {
        let tool = tools.filter(t => t.type === type);
        if (tool && tool.length >= 0) this.currentTool = tool[0];

        switch (type) {
          case ToolsType.DRAG:
            this.changeToDrag();
            break;
          case ToolsType.CONNECTION:
            this.changeToConnection();
            break;
          case ToolsType.FLOW:
            this.showAttrConfig(true);
            break;
        }
      },
      // 切换为拖拽
      changeToDrag() {
        this.flowData.nodeList.forEach(node => {
          let f = this.plumb.toggleDraggable(node.id);
          if (!f) {
            this.plumb.toggleDraggable(node.id);
          }
          if (node.type !== LaneNodeType.X_LANE && node.type !== LaneNodeType.Y_LANE) {
            this.plumb.unmakeSource(node.id);
            this.plumb.unmakeTarget(node.id);
          }
        });
      },
      // 切换为连线
      changeToConnection() {
        this.flowData.nodeList.forEach(node => {
          let f = this.plumb.toggleDraggable(node.id);
          if (f) {
            this.plumb.toggleDraggable(node.id);
          }
          if (node.type !== HighNodeType.VIRTUAL && node.type !== LaneNodeType.X_LANE && node.type !== LaneNodeType.Y_LANE) {
            if (node.type !== HighNodeType.JOB) {
              this.plumb.makeSource(
                node.id,
                flowConfig.jsPlumbConfig.makeSourceConfig
              );
            }
            this.plumb.makeTarget(
              node.id,
              flowConfig.jsPlumbConfig.makeTargetConfig
            );
          }
        });

        this.currentSelect = {};
        this.currentSelectGroup = [];
      },
      // 切换为放大工具
      changeToZoomIn() {
        console.log("切换到放大工具");
      },
      // 切换为缩小工具
      changeToZoomOut() {
        console.log("切换到缩小工具");
      },
      // 检测数据有效性
      checkFlow() {
        let nodeList = this.flowData.nodeList;

        if (nodeList.length <= 0) {
          this.$message.warning("流程无任何节点");
          return false;
        }
        return true;
      },
      // 发布流程
      publishFlow() {
        let flowObj = Object.assign({}, this.flowData);
        if (!this.checkFlow()) return;

        if (!flowObj.attrs.flowKey || !flowObj.attrs.flowName) {
          this.$message.warning("流程KEY或流程名称不能为空");
          return
        }
        // 生成流程图
        this.previewFlow(false)
        let d = JSON.stringify(flowObj);
        let flowJson = deepClone(flowObj);
        flowJson.photo = null

        setTimeout(() => {
          flowObj.status = flowConfig.flowStatus.SAVE;
          flowObj.attrs.flowJson = JSON.stringify(flowJson)
          defFlow.addObj(flowObj).then(resp => {
            this.$message.success("发布流程成功,请查看控制台.");
          }).catch(() => {
            this.$message.error("发布流程失败");
          })
        }, 2000)

        console.log(d)
        return d;
      },
      // 预览流程
      previewFlow(isShow) {
        if (!this.checkFlow()) return;

        let $Container = this.$refs.flowArea.$el.children[0],
          svgElems = $Container.querySelectorAll('svg[class^="jtk-connector"]'),
          removeArr = [];

        svgElems.forEach(svgElem => {
          let linkCanvas = document.createElement("canvas");
          let canvasId = utils.getId();
          linkCanvas.id = canvasId;
          removeArr.push(canvasId);

          let svgContent = svgElem.outerHTML.trim();
          canvg(linkCanvas, svgContent);
          if (svgElem.style.position) {
            linkCanvas.style.position += svgElem.style.position;
            linkCanvas.style.left += svgElem.style.left;
            linkCanvas.style.top += svgElem.style.top;
          }
          $Container.appendChild(linkCanvas);
        });

        let canvasSize = this.computeCanvasSize();

        let pbd = flowConfig.defaultStyle.photoBlankDistance;
        let offsetPbd = utils.div(pbd, 2);

        html2canvas($Container, {
          width: canvasSize.maxX + offsetPbd,
          height: canvasSize.maxY + offsetPbd,
          scrollX: 0,
          scrollY: 0,
          logging: false,
          onclone: () => {
            removeArr.forEach(id => {
              let currentNode = document.getElementById(id)
              currentNode.parentNode.removeChild(currentNode);
            });
          }
        }).then(canvas => {
          this.flowPicture.url = canvas.toDataURL("image/png");
          if (isShow === false) this.flowData.attrs.photo = this.flowPicture.url
          else this.flowPicture.modalVisible = true;
        });
      },
      // 下载图片
      downLoadFlowPicture() {
        let alink = document.createElement("a");
        alink.id = utils.getId();
        alink.href = this.flowPicture.url;
        alink.download = "流程图_" + this.flowData.attrs.id + ".png";
        alink.click();
      },
      upLoadFlowPicture() {
        defFlow.putObj({id: this.flowData.attrs.id, photo: this.flowPicture.url}).then(resp => {
          this.$message.success("上传成功,请查看控制台.");
        }).catch(() => {
          this.$message.error("上传失败");
        })
      },
      // 取消下载
      cancelPreviewFlow() {
        this.flowPicture.url = null;
        this.flowPicture.modalVisible = false;
      },
      // 计算流程图宽高
      computeCanvasSize() {
        let nodeList = Object.assign([], this.flowData.nodeList),
          minX = nodeList[0].x,
          minY = nodeList[0].y,
          maxX = nodeList[0].x + nodeList[0].width,
          maxY = nodeList[0].y + nodeList[0].height;
        nodeList.forEach(node => {
          minX = Math.min(minX, node.x);
          minY = Math.min(minY, node.y);
          maxX = Math.max(maxX, node.x + node.width);
          maxY = Math.max(maxY, node.y + node.height);
        });
        let canvasWidth = maxX - minX;
        let canvasHeight = maxY - minY;
        return {
          width: canvasWidth,
          height: canvasHeight,
          minX: minX,
          minY: minY,
          maxX: maxX,
          maxY: maxY
        };
      },
      // 清除画布
      clear() {
        this.flowData.nodeList.forEach(node => {
          this.plumb.remove(node.id);
        });
        this.currentSelect = {};
        this.currentSelectGroup = [];
        this.flowData.nodeList = [];
        this.flowData.linkList = [];
        this.flowData.attrs.remark = '';
      },
      // 显示隐藏网格
      toggleShowGrid() {
        let flag = this.gridConfig.showGrid;
        if (flag) {
          this.gridConfig.showGrid = false;
          this.gridConfig.showGridText = "显示网格";
          this.gridConfig.showGridIcon = "poweroff";
        } else {
          this.gridConfig.showGrid = true;
          this.gridConfig.showGridText = "隐藏网格";
          this.gridConfig.showGridIcon = "aim";
        }
      },
      // 设置
      setting() {
        this.$refs.settingModal.open();
      },
      // 快捷键
      shortcutHelper() {
        this.$refs.shortcutModal.open();
      },
      // 使用文档
      usingDoc() {
        window.open("http://1.15.77.119:9000/");
      },
      // 退出流程设计
      exitFlow() {
        setStore({
          name: 'access_token',
          content: "",
          type: 'session'
        })
        this.$router.push({path: "/"});
        this.$message.info("退出成功");
      },
      // 连接线右键
      showLinkContextMenu(e) {
        let event = window.event || e;

        event.preventDefault();
        event.stopPropagation();
        document.querySelector(".vue-contextmenuName-flow-menu").style.display =
          "none";
        document.querySelector(".vue-contextmenuName-node-menu").style.display =
          "none";
        let x = event.clientX;
        let y = event.clientY;
        this.linkContextMenuData.axis = {x, y};
      },
      // 删除线
      deleteLink() {
        let sourceId = this.currentSelect.sourceId;
        let targetId = this.currentSelect.targetId;
        this.plumb.deleteConnection(
          this.plumb.getConnections({
            source: sourceId,
            target: targetId
          })[0]
        );
        let linkList = this.flowData.linkList;
        linkList.splice(
          linkList.findIndex(
            link => link.sourceId === sourceId && link.targetId === targetId
          ),
          1
        );
        this.currentSelect = {};
        // 减小节点任务数
        this.upOrDownNodeJobs(sourceId, targetId, false)
      },
      // 减小节点任务数
      upOrDownNodeJobs(sourceId, targetId, isUp) {
        let source = this.flowData.nodeList.find(f => f.id === sourceId);
        let target = this.flowData.nodeList.find(f => f.id === targetId);
        let bool = source.type === CommonNodeType.SERIAL || source.type === CommonNodeType.PARALLEL;
        if (bool && target.type === HighNodeType.JOB) {
          if (isUp) {
            // 计算源节点任务个数
            let sources = this.flowData.linkList.filter(f => f.sourceId === sourceId);
            if (sources.length < 1) source.jobSize = 1
            else {
              let targetIds = sources.map(m => m.targetId);
              let jobs = this.flowData.nodeList.filter(f => targetIds.includes(f.id) && f.type === HighNodeType.JOB);
              source.jobSize = jobs.length > 0 ? jobs.length : 1
            }
          } else if (source.jobSize > 1) {
            source.jobSize = source.jobSize - 1
          }
        }
      },
      // 设置快捷键失效
      loseShortcut() {
        this.activeShortcut = false;
      },
      // 设置快捷键启用
      getShortcut() {
        this.activeShortcut = true;
      },
      // 查看数据
      openViewJson() {
        this.$refs.jsonModal.flowData = Object.assign({}, this.flowData);
        this.$refs.jsonModal.viewJsonVisible = true;
      },
      // 键盘移动节点
      moveNode(type) {
        let m = flowConfig.defaultStyle.movePx,
          isX = true;
        switch (type) {
          case "left":
            m = -m;
            break;
          case "up":
            m = -m;
            isX = false;
            break;
          case "right":
            break;
          case "down":
            isX = false;
        }

        if (this.currentSelectGroup.length > 0) {
          this.currentSelectGroup.forEach(node => {
            if (isX) {
              node.x += m;
            } else {
              node.y += m;
            }
          });
          this.plumb.repaintEverything();
        } else if (this.currentSelect.id) {
          if (isX) {
            this.currentSelect.x += m;
          } else {
            this.currentSelect.y += m;
          }
          this.plumb.repaintEverything();
        }
      },
      showAttrConfig(bool) {
        this.attrConfigVisible = bool
      }
    }
  };
</script>

<style lang="less">
  @import "../assets/style/flow-designer.less";
</style>
