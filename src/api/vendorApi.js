import axios from 'axios'

/** 开发走 Vite 代理；生产需在网关将此前缀指向上游接口根地址 */
function apiPrefix () {
  return '/open-api-proxy'
}

const http = axios.create({
  timeout: 120000,
  transformResponse: [(data) => data]
})

function request (params) {
  return http
    .get(`${apiPrefix()}/zc/data.php`, {
      params,
      responseType: 'text'
    })
    .then((res) => String(res.data))
}

export function leftAmount (token) {
  return request({ code: 'leftAmount', token })
}

export function getPhone ({ token, keyWord, phone, province, cardType }) {
  return request({
    code: 'getPhone',
    token,
    keyWord,
    phone: phone || '',
    province: province || '',
    cardType: cardType || '全部'
  })
}

export function getMsg ({ token, phone, keyWord }) {
  return request({
    code: 'getMsg',
    token,
    phone,
    keyWord
  })
}

export function releasePhone ({ token, phone }) {
  return request({
    code: 'release',
    token,
    phone
  })
}
