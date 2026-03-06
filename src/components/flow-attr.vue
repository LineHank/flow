<template>
  <a-tabs size="small" class="flow-attr" :activeKey="activeKey" @change="activeKey = $event">
    <!-- 流程属性 -->
    <a-tab-pane key="flow-attr" tab="流程属性">
      <a-form v-bind="formLayout">
        <a-form-item label="已有流程">
          <div class="flow-select-row">
            <a-select
              v-model="defFlowId"
              allowClear
              showSearch
              placeholder="可选择已有流程"
              optionFilterProp="children"
              style="width: 200px"
            >
              <a-select-option v-for="item in defFlows" :key="item.id" :value="item.id">
                {{ item.flowKey }}
              </a-select-option>
            </a-select>
            <a-button type="primary" ghost @click="loadExistFlow">加载</a-button>
          </div>
        </a-form-item>
        <a-form-item label="当前流程ID">
          <a-input v-model="flowData.attrs.id" disabled />
        </a-form-item>
        <a-form-item label="流程名称">
          <a-input v-model="flowData.attrs.flowName" />
        </a-form-item>
        <a-form-item label="流程KEY">
          <a-input v-model="flowData.attrs.flowKey" placeholder="一般为工单实体类名称" />
        </a-form-item>
        <a-form-item label="流程备注">
          <a-input v-model="flowData.attrs.remark" />
        </a-form-item>
        <a-form-item label="流程排序">
          <a-input-number v-model="flowData.attrs.sort" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item label="是否有效">
          <attr-switch v-model="flowData.attrs.isValid" />
        </a-form-item>
      </a-form>
    </a-tab-pane>

    <!-- 节点属性 -->
    <a-tab-pane key="node-attr" tab="节点属性">
      <a-form v-bind="formLayout" v-if="showNodeAttr">
        <a-divider>节点配置</a-divider>
        <div class="attr-tip">注: 当前节点没有单独配置【节点任务】时，作为节点默认的任务属性配置</div>

        <a-form-item label="节点类型">
          <a-tag>{{ currentSelect.type }}</a-tag>
        </a-form-item>
        <a-form-item label="节点ID">
          <a-input v-model="currentSelect.id" disabled />
        </a-form-item>
        <a-form-item label="节点名称">
          <a-input
            v-model="currentSelect.nodeName"
            :placeholder="nodeNamePlaceholder"
            :disabled="isNodeNameDisabled"
          />
        </a-form-item>

        <!-- 通用节点配置 -->
        <template v-if="hasAttrsConfig">
          <a-form-item label="PC待办页面">
            <a-select v-model="currentSelect.attrs.pcTodoUrl" mode="multiple" allowClear placeholder="请选择PC待办页面" style="width: 100%">
              <a-select-option v-for="item in tabsOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="PC已办页面">
            <a-select v-model="currentSelect.attrs.pcFinishUrl" mode="multiple" allowClear placeholder="请选择PC已办页面" style="width: 100%">
              <a-select-option v-for="item in tabsOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="节点时限">
            <a-input-number v-model="currentSelect.attrs.timeout" placeholder="小于0则不限制" style="width: 100%" />
          </a-form-item>
          <a-form-item label="节点排序">
            <a-input-number v-model="currentSelect.attrs.sort" style="width: 100%" />
          </a-form-item>
        </template>

        <template v-if="currentSelect.type === CommonNodeType.END">
          <a-form-item label="是否自动结束">
            <attr-switch v-model="currentSelect.attrs.isAutoEnd" />
          </a-form-item>
        </template>

        <template v-if="[CommonNodeType.SERIAL, CommonNodeType.PARALLEL].indexOf(currentSelect.type) !== -1">
          <a-form-item label="是否等待兄弟任务">
            <attr-switch v-model="currentSelect.attrs.isWaitSibling" />
          </a-form-item>
          <a-form-item label="是否自动流转下一节点">
            <attr-switch v-model="currentSelect.attrs.isAutoNext" />
          </a-form-item>
          <a-form-item label="驳回类型">
            <attr-switch v-model="currentSelect.attrs.rejectType" checkedChildren="直接返回" unCheckedChildren="依次返回" />
          </a-form-item>
          <a-form-item label="是否继续下一节点">
            <attr-switch v-model="currentSelect.attrs.isContinue" />
          </a-form-item>
        </template>

        <template v-if="currentSelect.type === HighNodeType.VIRTUAL">
          <a-form-item label="驳回类型">
            <attr-switch v-model="currentSelect.attrs.rejectType" disabled checkedChildren="直接返回" unCheckedChildren="依次返回" />
          </a-form-item>
        </template>

        <template v-if="currentSelect.type === HighNodeType.CHILD_FLOW">
          <a-form-item label="子流程KEY">
            <a-input v-model="currentSelect.childFlowKey" placeholder="请输入子流程KEY" />
          </a-form-item>
        </template>

        <a-form-item v-if="currentSelect.attrs" label="是否有效">
          <attr-switch v-model="currentSelect.attrs.isValid" />
        </a-form-item>

        <!-- 节点监听配置 -->
        <template v-if="hasClazzConfig">
          <a-divider>节点监听配置</a-divider>
          <a-form-item label="监听类">
            <a-input v-model="currentSelect.clazz.clazz" placeholder="Bean名称：BusinessInterceptor实现类" />
          </a-form-item>
          <a-form-item label="方法名称">
            <a-select v-model="currentSelect.clazz.methods" mode="multiple" allowClear placeholder="多个方法名称，英文逗号分隔" style="width: 100%">
              <a-select-option v-for="item in DIC_PROP.METHODS" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="办理人员角色">
            <a-select v-model="currentSelect.clazz.roleId" showSearch allowClear placeholder="请选择" style="width: 100%" optionFilterProp="children">
              <a-select-option v-for="item in roles" :key="item.roleId" :value="item.roleId">{{ item.roleName }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="动态办理人KEY">
            <a-select v-model="currentSelect.clazz.userKey" showSearch allowClear style="width: 100%" optionFilterProp="children">
              <a-select-option v-for="item in userKeys" :key="item.userKey" :value="item.userKey">{{ item.userKey }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="办理人员类型">
            <a-select v-model="currentSelect.clazz.dynamicType" allowClear style="width: 100%">
              <a-select-option v-for="item in DIC_PROP.DYNAMIC_TYPE" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="监听备注">
            <a-input v-model="currentSelect.clazz.remark" />
          </a-form-item>
          <a-form-item label="监听排序">
            <a-input-number v-model="currentSelect.clazz.sort" :min="1" style="width: 100%" />
          </a-form-item>
        </template>
      </a-form>
    </a-tab-pane>

    <!-- 节点任务属性 -->
    <a-tab-pane key="node-job-attr" tab="节点任务属性">
      <a-form v-bind="formLayout" v-if="showNodeJobAttr">
        <div class="attr-tip">注: 当前节点单独配置【节点任务】时，则节点上配置的默认任务属性失效</div>

        <a-form-item label="任务名称">
          <a-input v-model="currentSelect.defJob.jobName" placeholder="请输入任务名称" />
        </a-form-item>
        <a-form-item label="办理人员">
          <a-select v-model="currentSelect.defJob.userId" showSearch allowClear placeholder="一般设置角色非人员" style="width: 100%" optionFilterProp="children">
            <a-select-option v-for="item in users" :key="item.userId" :value="item.userId">{{ item.username }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="办理人员角色">
          <a-select v-model="currentSelect.defJob.roleId" showSearch allowClear style="width: 100%" optionFilterProp="children">
            <a-select-option v-for="item in roles" :key="item.roleId" :value="item.roleId">{{ item.roleName }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="任务类型">
          <a-select v-model="currentSelect.defJob.jobType" style="width: 100%">
            <a-select-option v-for="item in DIC_PROP.JOB_TYPE" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="动态办理人KEY">
          <a-select v-model="currentSelect.defJob.userKey" showSearch allowClear style="width: 100%" optionFilterProp="children">
            <a-select-option v-for="item in userKeys" :key="item.userKey" :value="item.userKey">{{ item.userKey }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="办理人员类型">
          <a-select v-model="currentSelect.defJob.dynamicType" allowClear style="width: 100%">
            <a-select-option v-for="item in DIC_PROP.DYNAMIC_TYPE" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="待分配办理人KEY">
          <a-select v-model="currentSelect.defJob.distUserKey" showSearch allowClear style="width: 100%" optionFilterProp="children">
            <a-select-option v-for="item in userKeys" :key="item.userKey" :value="item.userKey">{{ item.userKey }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="待分配人员类型">
          <a-select v-model="currentSelect.defJob.distDynType" allowClear style="width: 100%">
            <a-select-option v-for="item in DIC_PROP.DYNAMIC_TYPE" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="审批后是否立即执行监听">
          <attr-switch v-model="currentSelect.defJob.isNowCall" />
        </a-form-item>
        <a-form-item label="被分配后立即运行">
          <attr-switch v-model="currentSelect.defJob.isNowRun" />
        </a-form-item>
        <a-form-item label="任务时限">
          <a-input-number v-model="currentSelect.defJob.timeout" placeholder="小于0则不限制" style="width: 100%" />
        </a-form-item>
        <a-form-item label="任务排序">
          <a-input-number v-model="currentSelect.defJob.sort" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item label="被驳回是否可跳过">
          <attr-switch v-model="currentSelect.defJob.isSkip" />
        </a-form-item>
        <a-form-item label="是否有效">
          <attr-switch v-model="currentSelect.defJob.isValid" />
        </a-form-item>
      </a-form>
    </a-tab-pane>

    <!-- 连线属性 -->
    <a-tab-pane key="link-attr" tab="连线属性">
      <a-form v-bind="formLayout" v-if="currentSelect.type === CommonNodeType.LINK">
        <a-divider>连线配置</a-divider>
        <a-form-item label="连线ID">
          <a-input v-model="currentSelect.id" disabled />
        </a-form-item>
        <a-form-item label="源节点">
          <a-input v-model="currentSelect.sourceId" disabled />
        </a-form-item>
        <a-form-item label="目标节点">
          <a-input v-model="currentSelect.targetId" disabled />
        </a-form-item>
        <a-form-item label="连线名称">
          <a-input v-model="currentSelect.label" @change="onLinkLabelChange" />
        </a-form-item>
        <a-divider>连线条件配置</a-divider>
        <a-form-item label="条件变量名(新增)">
          <a-select v-model="currentSelect.attrs.varKey" allowClear showSearch mode="tags" placeholder="请选择或新增条件变量名" style="width: 100%">
            <a-select-option v-for="item in varKeys" :key="item.varKey" :value="item.varKey">{{ item.varKey }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="条件变量值(新增)">
          <a-select v-model="currentSelect.attrs.varVal" allowClear showSearch mode="tags" placeholder="请选择或新增条件变量值" style="width: 100%">
            <a-select-option value="varVal">varVal</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="条件值类型">
          <a-select v-model="currentSelect.attrs.valType" allowClear style="width: 100%">
            <a-select-option v-for="item in DIC_PROP.VAL_TYPE" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="条件运算符">
          <a-select v-model="currentSelect.attrs.operator" allowClear style="width: 100%">
            <a-select-option v-for="item in DIC_PROP.OPERATOR" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="条件运算类型">
          <a-select v-model="currentSelect.attrs.operatorType" allowClear style="width: 100%">
            <a-select-option v-for="item in DIC_PROP.OPERATOR_TYPE" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="是否有效">
          <attr-switch v-model="currentSelect.attrs.isValid" />
        </a-form-item>
      </a-form>
    </a-tab-pane>
  </a-tabs>
</template>

<script>
import { CommonNodeType, HighNodeType, LaneNodeType } from '@/config/type'
import { DIC_PROP } from '@/utils/dict-prop'
import * as defFlow from '@/api/flow'

// 通用开关组件，支持 '1'/'0' 双向绑定
const AttrSwitch = {
  name: 'AttrSwitch',
  props: {
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    checkedChildren: { type: String, default: '是' },
    unCheckedChildren: { type: String, default: '否' }
  },
  render(h) {
    const checked = this.value === '1'
    return h('a-switch', {
      props: {
        checked,
        disabled: this.disabled,
        checkedChildren: this.checkedChildren,
        unCheckedChildren: this.unCheckedChildren
      },
      on: {
        change: (v) => this.$emit('input', v ? '1' : '0')
      }
    })
  }
}

const NODE_TYPES_WITH_ATTRS = [CommonNodeType.START, CommonNodeType.END, CommonNodeType.SERIAL, CommonNodeType.PARALLEL, HighNodeType.VIRTUAL]
const NODE_TYPES_WITH_JOB = [...NODE_TYPES_WITH_ATTRS, HighNodeType.JOB]
const DEFAULT_MOCK_DATA = {
  defFlows: [{ id: 1, flowKey: 'AskLeave' }],
  userKeys: [{ userKey: 'create_user' }],
  varKeys: [{ varKey: 'isNeedUserAudit' }],
  tabsOptions: [{ id: 2, label: '审批过程' }, { id: 3, label: '查看流程图' }],
  roles: [{ roleId: 1, roleName: '管理员' }],
  users: [{ userId: 1, username: 'admin' }]
}

export default {
  name: 'FlowAttr',
  components: { AttrSwitch },
  props: {
    plumb: { type: Object, required: true },
    flowData: { type: Object, required: true },
    select: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      currentSelect: { ...this.select },
      activeKey: 'flow-attr',
      CommonNodeType,
      HighNodeType,
      LaneNodeType,
      DIC_PROP,
      formLayout: { labelCol: { span: 6 }, wrapperCol: { span: 18 } },
      userKeys: [],
      tabsOptions: [],
      varKeys: [],
      roles: [],
      users: [],
      defFlows: [],
      defFlowId: null
    }
  },
  computed: {
    showNodeAttr() {
      const { type } = this.currentSelect
      return type && type !== CommonNodeType.LINK && type !== HighNodeType.JOB
    },
    showNodeJobAttr() {
      return NODE_TYPES_WITH_JOB.indexOf(this.currentSelect.type) !== -1
    },
    hasAttrsConfig() {
      return NODE_TYPES_WITH_ATTRS.indexOf(this.currentSelect.type) !== -1
    },
    hasClazzConfig() {
      return NODE_TYPES_WITH_ATTRS.indexOf(this.currentSelect.type) !== -1
    },
    isNodeNameDisabled() {
      return [CommonNodeType.START, CommonNodeType.END].indexOf(this.currentSelect.type) !== -1
    },
    nodeNamePlaceholder() {
      return '请输入节点名称'
    }
  },
  mounted() {
    if (!DIC_PROP.isNeedService) {
      this.$message.warning('注: 默认不开启后端服务器，故部分配置数据选项为默认数据')
      Object.assign(this, DEFAULT_MOCK_DATA)
      return
    }
    this.fetchOptions()
  },
  methods: {
    async fetchOptions() {
      const apis = [
        ['defFlows', defFlow.listDefFlow, '获取流程数据失败'],
        ['userKeys', defFlow.listUserKey, '获取用户KEY失败'],
        ['tabsOptions', defFlow.listTabsOptions, '获取审批页面失败'],
        ['varKeys', defFlow.listVarKey, '获取条件KEY失败'],
        ['roles', defFlow.listRole, '获取角色失败'],
        ['users', defFlow.listUser, '获取人员失败']
      ]
      for (const [key, api, errMsg] of apis) {
        try {
          const resp = await api()
          this[key] = (resp && resp.data && resp.data.data) || []
        } catch {
          this.$message.error(errMsg)
        }
      }
    },
    onLinkLabelChange(e) {
      const label = (e && e.target && e.target.value) || this.currentSelect.label || ''
      this.linkLabelChange(label)
    },
    linkLabelChange(label) {
      const conns = this.plumb.getConnections({
        source: this.currentSelect.sourceId,
        target: this.currentSelect.targetId
      })
      const conn = conns[0]
      if (!conn) return

      const linkId = conn.canvas && conn.canvas.id
      if (!linkId) return

      const labelHandle = (e) => {
        const ev = e || window.event
        if (ev && ev.stopPropagation) ev.stopPropagation()
        this.currentSelect = this.flowData.linkList.filter(function(l) { return l.id === linkId })[0] || {}
      }

      const labelEl = document.getElementsByClassName(linkId)[0]
      if (label) {
        conn.setLabel({ label, cssClass: `link-label ${linkId}` })
        if (labelEl && labelEl.addEventListener) labelEl.addEventListener('click', labelHandle)
      } else {
        if (labelEl && labelEl.removeEventListener) labelEl.removeEventListener('click', labelHandle)
        const overlay = conn.getLabelOverlay()
        if (overlay) conn.removeOverlay(overlay.id)
      }
    },
    loadExistFlow() {
      if (!this.defFlowId) {
        this.$message.warning('请先选择已有流程')
        return
      }
      var flowId = this.defFlowId
      const flow = this.defFlows.filter(function(f) { return f.id === flowId })[0]
      if (!flow) {
        this.$message.warning('流程数据不存在')
        return
      }
      this.$confirm({
        title: '提示',
        content: `是否加载流程 ${flow.flowKey}？`,
        okText: '确定',
        cancelText: '取消'
      }).then(() => {
        this.$emit('loadFlow', flow.flowJson)
        this.$emit('showAttrConfig', false)
      })
    }
  },
  watch: {
    select: {
      handler(val) {
        this.currentSelect = val || {}
        const type = this.currentSelect.type
        const tabMap = {
          [CommonNodeType.LINK]: 'link-attr',
          [HighNodeType.JOB]: 'node-job-attr'
        }
        this.activeKey = tabMap[type] || (type ? 'node-attr' : 'flow-attr')
      },
      immediate: true
    },
    currentSelect: {
      handler(val) {
        this.$emit('update:select', val)
      },
      deep: true
    }
  }
}
</script>

<style lang="less" scoped>
.attr-tip {
  margin: 5px 20px;
  color: red;
  font-size: 14px;
}
.flow-select-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

<style lang="less">
@import '../assets/style/flow-attr.less';
</style>
