import request from '@/router/axios'

export function listDefFlow() {
  return request({
    url: '/howe/def-flow/list',
    method: 'get'
  })
}

export function addObj(obj) {
  return request({
    url: '/howe/def-flow',
    method: 'post',
    data: obj
  })
}

export function putObj(obj) {
  return request({
    url: '/howe/def-flow',
    method: 'put',
    data: obj
  })
}

export function listUserKey() {
  return request({
    url: '/howe/node-job/list/user-key',
    method: 'get'
  })
}

export function listTabsOptions() {
  return request({
    url: '/howe/tabs-option/list',
    method: 'get'
  })
}

export function listVarKey() {
  return request({
    url: '/howe/flow-node-rel/list/var-key',
    method: 'get'
  })
}

export function listRole() {
  return request({
    url: '/admin/role/list',
    method: 'get'
  })
}

export function listUser() {
  return request({
    url: '/admin/user/list',
    method: 'get'
  })
}
