<template>
  <a-modal
    title="快捷键"
    :width="720"
    :visible="modalVisible"
    @cancel="cancel"
  >
    <a-table
      :columns="columns"
      :dataSource="dataSource"
      :pagination="false"
      rowKey="key"
      size="small"
    />
    <template slot="footer">
      <a-button @click="cancel">取 消</a-button>
      <a-button type="primary" @click="saveSetting">确 定</a-button>
    </template>
  </a-modal>
</template>

<script>
  import {flowConfig} from '@/config/flow-config'

  export default {
    data() {
      return {
        modalVisible: false,
        columns: [
          {
            title: '功能',
            align: 'center',
            dataIndex: 'shortcutName',
            width: '50%'
          },
          {
            title: '快捷键',
            align: 'center',
            dataIndex: 'codeName',
            width: '50%'
          }
        ],
        dataSource: []
      }
    },
    mounted() {
      let obj = Object.assign({}, flowConfig.shortcut)
      for (let k in obj) {
        this.dataSource.push({ ...obj[k], key: k })
      }
    },
    methods: {
      open() {
        this.modalVisible = true
      },
      close() {
        this.modalVisible = false
      },
      saveSetting() {
        this.close()
      },
      cancel() {
        this.close()
      }
    }
  }
</script>

<style>
</style>
