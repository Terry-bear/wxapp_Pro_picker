import { convertStringToJSON, reqData, httpsPromisify } from '../../../utils/util'
var app = getApp()
/**
 * @param {function} fun 接口
 * @param {object} options 接口参数
 * @returns {Promise} Promise对象
 * @param {Array} dataWithDot
 */

const API = app.globalData.areaAdress


const conf = {
  /**
   * @method addDot 只有这个方法正确处理数据才能在前端展示
   * @param {Object} obj
   */
  // 如果是数组,进行长度处理
  addDot: function(arr) {
    if (arr instanceof Array) {
      const tmp = arr.slice()
      tmp.map(val => {
        if (val.areaName.length > 4) {
          val.areaNameDot = val.areaName.slice(0, 4) + '...'
        } else {
          val.areaNameDot = val.areaName
        }
      })
      return tmp
    }
  },
  // 如果是对象,进行长度处理
  addDotObj: function(obj) {
    if (obj instanceof Object) {
      const objToStr = obj.areaName + ''
      if (objToStr.length > 4) {
        obj.areaNameDot = objToStr.slice(0, 4) + '...'
      } else {
        obj.areaNameDot = obj.areaName
      }
      return obj
    }
  },

  /**
   * 滑动事件
   * @param {object} e 事件对象
   */
  bindChange: function(e) {
    const currentValue = e.detail.value
    const { value, provinceData } = this.data.areaPicker
    let currentProvince = provinceData[currentValue[0]].areaCode
    let currentProvinceName = provinceData[currentValue[0]].areaName
    let queryCurrentProvince = reqData(currentProvince)
    let queryCurrentProvinceJSON = convertStringToJSON('query', queryCurrentProvince)
    const self = _getCurrentPage()
    const hideDistrict = self.config.hideDistrict
    const provinceCondition = hideDistrict
      ? value[0] !== currentValue[0] && value[1] === currentValue[1]
      : value[0] !== currentValue[0] &&
        value[1] === currentValue[1] &&
        value[2] === currentValue[2]
    const cityCondition = hideDistrict
      ? value[0] === currentValue[0] && value[1] !== currentValue[1]
      : value[0] === currentValue[0] &&
        value[1] !== currentValue[1] &&
        value[2] === currentValue[2]
    const districtCondition = hideDistrict
      ? false
      : value[0] === currentValue[0] &&
        value[1] === currentValue[1] &&
        value[2] !== currentValue[2]
    if (provinceCondition) {
      // 滑动省份
      httpsPromisify({
        url: API,
        method: 'POST',
        header: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        data: queryCurrentProvinceJSON
      })
        .then(city => {
          // console.log('city', city)
          if (
            city.data.data == null ||
            city.data.data == undefined ||
            city.data.data == ''
          ) {
            this.setData({
              'areaPicker.cityData': [],
              'areaPicker.districtData': [],
              'areaPicker.address': provinceData[currentValue[0]].areaName,
              'areaPicker.selected': [provinceData[currentValue[0]]]
            })
            return
          }
          const cityData = city.data.data.filterAreaCodeInfoToApp
          if (cityData && cityData.length) {
            const dataWithDot = conf.addDot(cityData)
            /**
             |--------------------------------------------------
             | dataWithDot-cityData areaNameDot是渲染在页面的最终值
             // console.log('dataWithDot-cityData', dataWithDot)
            |--------------------------------------------------
            */
            this.setData({
              'areaPicker.cityData': dataWithDot
            })
            let currentCity = dataWithDot[0].areaCode
            let currentCityName = dataWithDot[0].areaName
            let querycurrentCity = reqData(currentCity)
            let querycurrentCityJSON = convertStringToJSON('query', querycurrentCity)
            return httpsPromisify({
              url: API,
              method: 'POST',
              header: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              data: querycurrentCityJSON
            })
          } else {
            this.setData({
              'areaPicker.cityData': [],
              'areaPicker.districtData': [],
              'areaPicker.address': provinceData[currentValue[0]].areaName,
              'areaPicker.selected': [provinceData[currentValue[0]]]
            })
          }
        })
        .then(district => {
          if (district == null || district == undefined || district == '') {
            this.setData({
              'areaPicker.districtData': [],
              'areaPicker.value': [currentValue[0], currentValue[1], 0],
              'areaPicker.address': provinceData[currentValue[0]].areaName,
              'areaPicker.selected': [provinceData[currentValue[0]]]
            })
            return
          }
          const districtData = district.data.data.filterAreaCodeInfoToApp
          const { cityData } = this.data.areaPicker
          if (districtData && districtData.length) {
            const dataWithDot = conf.addDot(districtData)
            /**
             |--------------------------------------------------
             | dataWithDot-districtData areaNameDot是渲染在页面的最终值
             // console.log('dataWithDot-cityData', dataWithDot)
            |--------------------------------------------------
            */
            this.setData({
              'areaPicker.districtData': dataWithDot,
              'areaPicker.value': [currentValue[0], 0, 0],
              'areaPicker.address':
                provinceData[currentValue[0]].areaName +
                ' - ' +
                cityData[0].areaName +
                (hideDistrict ? '' : ' - ' + dataWithDot[0].areaName),
              'areaPicker.selected': hideDistrict
                ? [provinceData[currentValue[0]], cityData[0]]
                : [provinceData[currentValue[0]], cityData[0], dataWithDot[0]]
            })
          } else {
            this.setData({
              'areaPicker.districtData': [],
              'areaPicker.value': [currentValue[0], currentValue[1], 0],
              'areaPicker.address':
                provinceData[currentValue[0]].areaName +
                ' - ' +
                cityData[0].areaName,
              'areaPicker.selected': [
                provinceData[currentValue[0]],
                cityData[0]
              ]
            })
          }
        })
        .catch(e => {
          console.error(e)
        })
    } else if (cityCondition) {
      // 滑动城市
      const { provinceData, cityData } = this.data.areaPicker
      let slideCity = cityData[currentValue[1]].areaCode
      let slideCityName = cityData[currentValue[1]].areaName
      let queryslideCity = reqData(slideCity)
      let queryslideCityJSON = convertStringToJSON('query', queryslideCity)
      httpsPromisify({
        url: API,
        method: 'POST',
        header: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        data: queryslideCityJSON
      })
        .then(district => {
          if (!district) return
          const districtData = district.data.data.filterAreaCodeInfoToApp
          if (districtData && districtData.length) {
            const dataWithDot = conf.addDot(districtData)
            /**
             |--------------------------------------------------
             | dataWithDot-districtData areaNameDot是渲染在页面的最终值
             // console.log('dataWithDot-districtData', dataWithDot)
            |--------------------------------------------------
            */
            this.setData({
              'areaPicker.districtData': dataWithDot,
              'areaPicker.value': [currentValue[0], currentValue[1], 0],
              'areaPicker.address':
                provinceData[currentValue[0]].areaName +
                ' - ' +
                cityData[currentValue[1]].areaName +
                (hideDistrict ? '' : ' - ' + dataWithDot[0].areaName),
              'areaPicker.selected': hideDistrict
                ? [provinceData[currentValue[0]], cityData[currentValue[1]]]
                : [
                    provinceData[currentValue[0]],
                    cityData[currentValue[1]],
                    dataWithDot[0]
                  ]
            })
          } else {
            this.setData({
              'areaPicker.districtData': [],
              'areaPicker.value': [currentValue[0], currentValue[1], 0],
              'areaPicker.address':
                provinceData[currentValue[0]].areaName +
                ' - ' +
                cityData[currentValue[1]].areaName,
              'areaPicker.selected': [
                provinceData[currentValue[0]],
                cityData[currentValue[1]]
              ]
            })
          }
        })
        .catch(e => {
          console.error(e)
        })
    } else if (districtCondition) {
      const { cityData, districtData } = this.data.areaPicker
      // console.log('currentValue', currentValue) -->[3, 3, 2]      
      // 滑动地区
      this.setData({
        'areaPicker.value': currentValue,
        'areaPicker.address':
          provinceData[currentValue[0]].areaName +
          ' - ' +
          cityData[currentValue[1]].areaName +
          (hideDistrict ? '' : ' - ' + districtData[currentValue[2]].areaName),
        'areaPicker.selected': hideDistrict
          ? [provinceData[currentValue[0]], cityData[currentValue[1]]]
          : [
              provinceData[currentValue[0]],
              cityData[currentValue[1]],
              districtData[currentValue[2]]
            ]
      })
    }
  }
}

function _getCurrentPage() {
  const pages = getCurrentPages()
  const last = pages.length - 1
  return pages[last]
}

export const getSelectedAreaData = () => {
  const self = _getCurrentPage()
  return self.data.areaPicker.selected
}

export default (config = {}) => {
  const self = _getCurrentPage()
  self.setData({
    'areaPicker.hideDistrict': !config.hideDistrict
  })
  self.config = config
  self.bindChange = conf.bindChange.bind(self)

  /**
   * 默认获取省份
   */
  const queryCountry = `{
    filterAreaCodeInfoToApp:filterArea(areaCode: \\"\\") {
      areaCode:code,
      areaName:name
    }
  }`
  const queryCountryJSON = convertStringToJSON('query', queryCountry)
  httpsPromisify({
    url: API,
    method: 'POST',
    header: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    data: queryCountryJSON
  })
    .then(province => {
      const firstProvince = province.data.data.filterAreaCodeInfoToApp[0]
      const dataWithDot = conf.addDot(province.data.data.filterAreaCodeInfoToApp)
      /**
      |--------------------------------------------------
      | dataWithDot-firstProvince areaNameDot是渲染在页面的最终值
      | dataWithDot 必须为数组
      // console.log('dataWithDot-firstProvince', dataWithDot)
      |--------------------------------------------------
      */
      let queryProvince = reqData(firstProvince.areaCode)
      let queryProvinceJSON = convertStringToJSON('query', queryProvince)
      // console.log('queryProvinceJSON',queryProvinceJSON)
      /**
       * 默认选择获取的省份第一个省份数据
       */
      self.setData({
        'areaPicker.provinceData': dataWithDot,
        'areaPicker.selectedProvince.index': 0,
        'areaPicker.selectedProvince.areaCode': firstProvince.areaCode,
        'areaPicker.selectedProvince.areaName': firstProvince.areaName
      })
      return httpsPromisify({
        url: API,
        method: 'POST',
        header: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        data: queryProvinceJSON
      })
    })
    .then(city => {
      const firstCity = city.data.data.filterAreaCodeInfoToApp[0]
      const dataWithDot = conf.addDotObj(firstCity)
      // console.log('dataWithDot-firstCity',dataWithDot)
      // console.log('firstCity',firstCity)
      let queryCity = reqData(firstCity.areaCode)
      let queryCityJSON = convertStringToJSON('query', queryCity)
      self.setData({
        'areaPicker.cityData': [dataWithDot],
        'areaPicker.selectedCity.index': 0,
        'areaPicker.selectedCity.areaCode': firstCity.areaCode,
        'areaPicker.selectedCity.areaName': firstCity.areaName
      })
      /**
       * 省市二级则不请求区域
       */
      if (!config.hideDistrict) {
        return httpsPromisify({
          url: API,
          method: 'POST',
          header: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          data: queryCityJSON
        })
      } else {
        const { provinceData, cityData } = self.data.areaPicker
        self.setData({
          'areaPicker.value': [0, 0],
          'areaPicker.address':
            provinceData[0].areaName + ' - ' + cityData[0].areaName,
          'areaPicker.selected': [provinceData[0], cityData[0]]
        })
      }
    })
    .then(district => {
      if (!district) return
      const firstDistrict = district.data.data.filterAreaCodeInfoToApp[0]
      const dataWithDot = conf.addDot(district.data.data.filterAreaCodeInfoToApp)
      const { provinceData, cityData } = self.data.areaPicker
      let queryDistrict = reqData(firstDistrict.areaCode)
      let queryDistrictJSON = convertStringToJSON('query', queryDistrict)
      // console.log('firstDistrict',firstDistrict)
      self.setData({
        'areaPicker.value': [0, 0, 0],
        'areaPicker.districtData': dataWithDot,
        'areaPicker.selectedDistrict.index': 0,
        'areaPicker.selectedDistrict.areaCode': firstDistrict.areaCode,
        'areaPicker.selectedDistrict.areaName': firstDistrict.areaName,
        'areaPicker.address':
          provinceData[0].areaName +
          ' - ' +
          cityData.areaName +
          ' - ' +
          firstDistrict.areaName,
        'areaPicker.selected': [
          provinceData[0].areaName,
          cityData.areaName,
          firstDistrict.areaName
        ]
      })
    })
    .catch(e => {
      console.error(e)
    })
}
