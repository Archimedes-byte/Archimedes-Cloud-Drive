export interface RegionOption {
  value: string;
  label: string;
  children?: RegionOption[];
}

export const chinaProvinces: RegionOption[] = [
  {
    value: "beijing",
    label: "北京市",
    children: [
      { value: "beijing", label: "北京市" }
    ]
  },
  {
    value: "tianjin",
    label: "天津市",
    children: [
      { value: "tianjin", label: "天津市" }
    ]
  },
  {
    value: "hebei",
    label: "河北省",
    children: [
      { value: "shijiazhuang", label: "石家庄市" },
      { value: "tangshan", label: "唐山市" },
      { value: "qinhuangdao", label: "秦皇岛市" },
      { value: "handan", label: "邯郸市" },
      { value: "xingtai", label: "邢台市" },
      { value: "baoding", label: "保定市" },
      { value: "zhangjiakou", label: "张家口市" },
      { value: "chengde", label: "承德市" },
      { value: "cangzhou", label: "沧州市" },
      { value: "langfang", label: "廊坊市" },
      { value: "hengshui", label: "衡水市" }
    ]
  },
  {
    value: "shanxi",
    label: "山西省",
    children: [
      { value: "taiyuan", label: "太原市" },
      { value: "datong", label: "大同市" },
      { value: "yangquan", label: "阳泉市" },
      { value: "changzhi", label: "长治市" },
      { value: "jincheng", label: "晋城市" },
      { value: "shuozhou", label: "朔州市" },
      { value: "jinzhong", label: "晋中市" },
      { value: "yuncheng", label: "运城市" },
      { value: "xinzhou", label: "忻州市" },
      { value: "linfen", label: "临汾市" },
      { value: "lvliang", label: "吕梁市" }
    ]
  },
  {
    value: "inner_mongolia",
    label: "内蒙古自治区",
    children: [
      { value: "hohhot", label: "呼和浩特市" },
      { value: "baotou", label: "包头市" },
      { value: "wuhai", label: "乌海市" },
      { value: "chifeng", label: "赤峰市" },
      { value: "tongliao", label: "通辽市" },
      { value: "ordos", label: "鄂尔多斯市" },
      { value: "hulunbuir", label: "呼伦贝尔市" },
      { value: "bayannur", label: "巴彦淖尔市" },
      { value: "ulanqab", label: "乌兰察布市" }
    ]
  },
  {
    value: "liaoning",
    label: "辽宁省",
    children: [
      { value: "shenyang", label: "沈阳市" },
      { value: "dalian", label: "大连市" },
      { value: "anshan", label: "鞍山市" },
      { value: "fushun", label: "抚顺市" },
      { value: "benxi", label: "本溪市" },
      { value: "dandong", label: "丹东市" },
      { value: "jinzhou", label: "锦州市" },
      { value: "yingkou", label: "营口市" },
      { value: "fuxin", label: "阜新市" },
      { value: "liaoyang", label: "辽阳市" },
      { value: "panjin", label: "盘锦市" },
      { value: "tieling", label: "铁岭市" },
      { value: "chaoyang", label: "朝阳市" },
      { value: "huludao", label: "葫芦岛市" }
    ]
  },
  {
    value: "jilin",
    label: "吉林省",
    children: [
      { value: "changchun", label: "长春市" },
      { value: "jilin", label: "吉林市" },
      { value: "siping", label: "四平市" },
      { value: "liaoyuan", label: "辽源市" },
      { value: "tonghua", label: "通化市" },
      { value: "baishan", label: "白山市" },
      { value: "songyuan", label: "松原市" },
      { value: "baicheng", label: "白城市" }
    ]
  },
  {
    value: "heilongjiang",
    label: "黑龙江省",
    children: [
      { value: "harbin", label: "哈尔滨市" },
      { value: "qiqihar", label: "齐齐哈尔市" },
      { value: "jixi", label: "鸡西市" },
      { value: "hegang", label: "鹤岗市" },
      { value: "shuangyashan", label: "双鸭山市" },
      { value: "daqing", label: "大庆市" },
      { value: "yichun", label: "伊春市" },
      { value: "jiamusi", label: "佳木斯市" },
      { value: "qitaihe", label: "七台河市" },
      { value: "mudanjiang", label: "牡丹江市" },
      { value: "heihe", label: "黑河市" },
      { value: "suihua", label: "绥化市" }
    ]
  },
  {
    value: "shanghai",
    label: "上海市",
    children: [
      { value: "shanghai", label: "上海市" }
    ]
  },
  {
    value: "jiangsu",
    label: "江苏省",
    children: [
      { value: "nanjing", label: "南京市" },
      { value: "wuxi", label: "无锡市" },
      { value: "xuzhou", label: "徐州市" },
      { value: "changzhou", label: "常州市" },
      { value: "suzhou", label: "苏州市" },
      { value: "nantong", label: "南通市" },
      { value: "lianyungang", label: "连云港市" },
      { value: "huaian", label: "淮安市" },
      { value: "yancheng", label: "盐城市" },
      { value: "yangzhou", label: "扬州市" },
      { value: "zhenjiang", label: "镇江市" },
      { value: "taizhou", label: "泰州市" },
      { value: "suqian", label: "宿迁市" }
    ]
  },
  {
    value: "zhejiang",
    label: "浙江省",
    children: [
      { value: "hangzhou", label: "杭州市" },
      { value: "ningbo", label: "宁波市" },
      { value: "wenzhou", label: "温州市" },
      { value: "jiaxing", label: "嘉兴市" },
      { value: "huzhou", label: "湖州市" },
      { value: "shaoxing", label: "绍兴市" },
      { value: "jinhua", label: "金华市" },
      { value: "quzhou", label: "衢州市" },
      { value: "zhoushan", label: "舟山市" },
      { value: "taizhou", label: "台州市" },
      { value: "lishui", label: "丽水市" }
    ]
  },
  {
    value: "anhui",
    label: "安徽省",
    children: [
      { value: "hefei", label: "合肥市" },
      { value: "wuhu", label: "芜湖市" },
      { value: "bengbu", label: "蚌埠市" },
      { value: "huainan", label: "淮南市" },
      { value: "maanshan", label: "马鞍山市" },
      { value: "huaibei", label: "淮北市" },
      { value: "tongling", label: "铜陵市" },
      { value: "anqing", label: "安庆市" },
      { value: "huangshan", label: "黄山市" },
      { value: "chuzhou", label: "滁州市" },
      { value: "fuyang", label: "阜阳市" },
      { value: "suzhou", label: "宿州市" },
      { value: "bozhou", label: "亳州市" },
      { value: "chizhou", label: "池州市" },
      { value: "xuancheng", label: "宣城市" }
    ]
  },
  {
    value: "fujian",
    label: "福建省",
    children: [
      { value: "fuzhou", label: "福州市" },
      { value: "xiamen", label: "厦门市" },
      { value: "putian", label: "莆田市" },
      { value: "sanming", label: "三明市" },
      { value: "quanzhou", label: "泉州市" },
      { value: "zhangzhou", label: "漳州市" },
      { value: "nanping", label: "南平市" },
      { value: "longyan", label: "龙岩市" },
      { value: "ningde", label: "宁德市" }
    ]
  },
  {
    value: "jiangxi",
    label: "江西省",
    children: [
      { value: "nanchang", label: "南昌市" },
      { value: "jingdezhen", label: "景德镇市" },
      { value: "pingxiang", label: "萍乡市" },
      { value: "jiujiang", label: "九江市" },
      { value: "xinyu", label: "新余市" },
      { value: "yingtan", label: "鹰潭市" },
      { value: "ganzhou", label: "赣州市" },
      { value: "jian", label: "吉安市" },
      { value: "yichun", label: "宜春市" },
      { value: "fuzhou", label: "抚州市" },
      { value: "shangrao", label: "上饶市" }
    ]
  },
  {
    value: "shandong",
    label: "山东省",
    children: [
      { value: "jinan", label: "济南市" },
      { value: "qingdao", label: "青岛市" },
      { value: "zibo", label: "淄博市" },
      { value: "zaozhuang", label: "枣庄市" },
      { value: "dongying", label: "东营市" },
      { value: "yantai", label: "烟台市" },
      { value: "weifang", label: "潍坊市" },
      { value: "jining", label: "济宁市" },
      { value: "taian", label: "泰安市" },
      { value: "weihai", label: "威海市" },
      { value: "rizhao", label: "日照市" },
      { value: "laiwu", label: "莱芜市" },
      { value: "linyi", label: "临沂市" },
      { value: "dezhou", label: "德州市" },
      { value: "liaocheng", label: "聊城市" },
      { value: "binzhou", label: "滨州市" },
      { value: "heze", label: "菏泽市" }
    ]
  },
  {
    value: "henan",
    label: "河南省",
    children: [
      { value: "zhengzhou", label: "郑州市" },
      { value: "kaifeng", label: "开封市" },
      { value: "luoyang", label: "洛阳市" },
      { value: "pingdingshan", label: "平顶山市" },
      { value: "anyang", label: "安阳市" },
      { value: "hebi", label: "鹤壁市" },
      { value: "xinxiang", label: "新乡市" },
      { value: "jiaozuo", label: "焦作市" },
      { value: "puyang", label: "濮阳市" },
      { value: "xuchang", label: "许昌市" },
      { value: "luohe", label: "漯河市" },
      { value: "sanmenxia", label: "三门峡市" },
      { value: "nanyang", label: "南阳市" },
      { value: "shangqiu", label: "商丘市" },
      { value: "xinyang", label: "信阳市" },
      { value: "zhoukou", label: "周口市" },
      { value: "zhumadian", label: "驻马店市" },
      { value: "jiyuan", label: "济源市" }
    ]
  },
  {
    value: "hubei",
    label: "湖北省",
    children: [
      { value: "wuhan", label: "武汉市" },
      { value: "huangshi", label: "黄石市" },
      { value: "shiyan", label: "十堰市" },
      { value: "yichang", label: "宜昌市" },
      { value: "xiangyang", label: "襄阳市" },
      { value: "ezhou", label: "鄂州市" },
      { value: "jingmen", label: "荆门市" },
      { value: "xiaogan", label: "孝感市" },
      { value: "jingzhou", label: "荆州市" },
      { value: "huanggang", label: "黄冈市" },
      { value: "xianning", label: "咸宁市" },
      { value: "suizhou", label: "随州市" },
      { value: "enshi", label: "恩施土家族苗族自治州" }
    ]
  },
  {
    value: "hunan",
    label: "湖南省",
    children: [
      { value: "changsha", label: "长沙市" },
      { value: "zhuzhou", label: "株洲市" },
      { value: "xiangtan", label: "湘潭市" },
      { value: "hengyang", label: "衡阳市" },
      { value: "shaoyang", label: "邵阳市" },
      { value: "yueyang", label: "岳阳市" },
      { value: "changde", label: "常德市" },
      { value: "zhangjiajie", label: "张家界市" },
      { value: "yiyang", label: "益阳市" },
      { value: "chenzhou", label: "郴州市" },
      { value: "yongzhou", label: "永州市" },
      { value: "huaihua", label: "怀化市" },
      { value: "loudi", label: "娄底市" },
      { value: "xiangxi", label: "湘西土家族苗族自治州" }
    ]
  },
  {
    value: "guangdong",
    label: "广东省",
    children: [
      { value: "guangzhou", label: "广州市" },
      { value: "shaoguan", label: "韶关市" },
      { value: "shenzhen", label: "深圳市" },
      { value: "zhuhai", label: "珠海市" },
      { value: "shantou", label: "汕头市" },
      { value: "foshan", label: "佛山市" },
      { value: "jiangmen", label: "江门市" },
      { value: "zhanjiang", label: "湛江市" },
      { value: "maoming", label: "茂名市" },
      { value: "zhaoqing", label: "肇庆市" },
      { value: "huizhou", label: "惠州市" },
      { value: "meizhou", label: "梅州市" },
      { value: "shanwei", label: "汕尾市" },
      { value: "heyuan", label: "河源市" },
      { value: "yangjiang", label: "阳江市" },
      { value: "qingyuan", label: "清远市" },
      { value: "dongguan", label: "东莞市" },
      { value: "zhongshan", label: "中山市" },
      { value: "chaozhou", label: "潮州市" },
      { value: "jieyang", label: "揭阳市" },
      { value: "yunfu", label: "云浮市" }
    ]
  },
  {
    value: "guangxi",
    label: "广西壮族自治区",
    children: [
      { value: "nanning", label: "南宁市" },
      { value: "liuzhou", label: "柳州市" },
      { value: "guilin", label: "桂林市" },
      { value: "wuzhou", label: "梧州市" },
      { value: "beihai", label: "北海市" },
      { value: "fangchenggang", label: "防城港市" },
      { value: "qinzhou", label: "钦州市" },
      { value: "guigang", label: "贵港市" },
      { value: "yulin", label: "玉林市" },
      { value: "baise", label: "百色市" },
      { value: "hezhou", label: "贺州市" },
      { value: "hechi", label: "河池市" },
      { value: "laibin", label: "来宾市" },
      { value: "chongzuo", label: "崇左市" }
    ]
  },
  {
    value: "hainan",
    label: "海南省",
    children: [
      { value: "haikou", label: "海口市" },
      { value: "sanya", label: "三亚市" },
      { value: "sansha", label: "三沙市" },
      { value: "danzhou", label: "儋州市" }
    ]
  },
  {
    value: "chongqing",
    label: "重庆市",
    children: [
      { value: "chongqing", label: "重庆市" }
    ]
  },
  {
    value: "sichuan",
    label: "四川省",
    children: [
      { value: "chengdu", label: "成都市" },
      { value: "zigong", label: "自贡市" },
      { value: "panzhihua", label: "攀枝花市" },
      { value: "luzhou", label: "泸州市" },
      { value: "deyang", label: "德阳市" },
      { value: "mianyang", label: "绵阳市" },
      { value: "guangyuan", label: "广元市" },
      { value: "suining", label: "遂宁市" },
      { value: "neijiang", label: "内江市" },
      { value: "leshan", label: "乐山市" },
      { value: "nanchong", label: "南充市" },
      { value: "meishan", label: "眉山市" },
      { value: "yibin", label: "宜宾市" },
      { value: "guangan", label: "广安市" },
      { value: "dazhou", label: "达州市" },
      { value: "yaan", label: "雅安市" },
      { value: "bazhong", label: "巴中市" },
      { value: "ziyang", label: "资阳市" },
      { value: "aba", label: "阿坝藏族羌族自治州" },
      { value: "ganzi", label: "甘孜藏族自治州" },
      { value: "liangshan", label: "凉山彝族自治州" }
    ]
  },
  {
    value: "guizhou",
    label: "贵州省",
    children: [
      { value: "guiyang", label: "贵阳市" },
      { value: "liupanshui", label: "六盘水市" },
      { value: "zunyi", label: "遵义市" },
      { value: "anshun", label: "安顺市" },
      { value: "bijie", label: "毕节市" },
      { value: "tongren", label: "铜仁市" },
      { value: "qianxinan", label: "黔西南布依族苗族自治州" },
      { value: "qiandongnan", label: "黔东南苗族侗族自治州" },
      { value: "qiannan", label: "黔南布依族苗族自治州" }
    ]
  },
  {
    value: "yunnan",
    label: "云南省",
    children: [
      { value: "kunming", label: "昆明市" },
      { value: "qujing", label: "曲靖市" },
      { value: "yuxi", label: "玉溪市" },
      { value: "baoshan", label: "保山市" },
      { value: "zhaotong", label: "昭通市" },
      { value: "lijiang", label: "丽江市" },
      { value: "puer", label: "普洱市" },
      { value: "lincang", label: "临沧市" },
      { value: "chuxiong", label: "楚雄彝族自治州" },
      { value: "honghe", label: "红河哈尼族彝族自治州" },
      { value: "wenshan", label: "文山壮族苗族自治州" },
      { value: "xishuangbanna", label: "西双版纳傣族自治州" },
      { value: "dali", label: "大理白族自治州" },
      { value: "dehong", label: "德宏傣族景颇族自治州" },
      { value: "nujiang", label: "怒江傈僳族自治州" },
      { value: "diqing", label: "迪庆藏族自治州" }
    ]
  },
  {
    value: "tibet",
    label: "西藏自治区",
    children: [
      { value: "lhasa", label: "拉萨市" },
      { value: "shigatse", label: "日喀则市" },
      { value: "chamdo", label: "昌都市" },
      { value: "nyingchi", label: "林芝市" },
      { value: "shannan", label: "山南市" },
      { value: "nagqu", label: "那曲市" },
      { value: "ali", label: "阿里地区" }
    ]
  },
  {
    value: "shaanxi",
    label: "陕西省",
    children: [
      { value: "xian", label: "西安市" },
      { value: "tongchuan", label: "铜川市" },
      { value: "baoji", label: "宝鸡市" },
      { value: "xianyang", label: "咸阳市" },
      { value: "weinan", label: "渭南市" },
      { value: "yanan", label: "延安市" },
      { value: "hanzhong", label: "汉中市" },
      { value: "yulin", label: "榆林市" },
      { value: "ankang", label: "安康市" },
      { value: "shangluo", label: "商洛市" }
    ]
  },
  {
    value: "gansu",
    label: "甘肃省",
    children: [
      { value: "lanzhou", label: "兰州市" },
      { value: "jiayuguan", label: "嘉峪关市" },
      { value: "jinchang", label: "金昌市" },
      { value: "baiyin", label: "白银市" },
      { value: "tianshui", label: "天水市" },
      { value: "wuwei", label: "武威市" },
      { value: "zhangye", label: "张掖市" },
      { value: "pingliang", label: "平凉市" },
      { value: "jiuquan", label: "酒泉市" },
      { value: "qingyang", label: "庆阳市" },
      { value: "dingxi", label: "定西市" },
      { value: "longnan", label: "陇南市" },
      { value: "linxia", label: "临夏回族自治州" },
      { value: "gannan", label: "甘南藏族自治州" }
    ]
  },
  {
    value: "qinghai",
    label: "青海省",
    children: [
      { value: "xining", label: "西宁市" },
      { value: "haidong", label: "海东市" },
      { value: "haibei", label: "海北藏族自治州" },
      { value: "huangnan", label: "黄南藏族自治州" },
      { value: "hainan", label: "海南藏族自治州" },
      { value: "golog", label: "果洛藏族自治州" },
      { value: "yushu", label: "玉树藏族自治州" },
      { value: "haixi", label: "海西蒙古族藏族自治州" }
    ]
  },
  {
    value: "ningxia",
    label: "宁夏回族自治区",
    children: [
      { value: "yinchuan", label: "银川市" },
      { value: "shizuishan", label: "石嘴山市" },
      { value: "wuzhong", label: "吴忠市" },
      { value: "guyuan", label: "固原市" },
      { value: "zhongwei", label: "中卫市" }
    ]
  },
  {
    value: "xinjiang",
    label: "新疆维吾尔自治区",
    children: [
      { value: "urumqi", label: "乌鲁木齐市" },
      { value: "karamay", label: "克拉玛依市" },
      { value: "turpan", label: "吐鲁番市" },
      { value: "hami", label: "哈密市" },
      { value: "changji", label: "昌吉回族自治州" },
      { value: "bortala", label: "博尔塔拉蒙古自治州" },
      { value: "bayingol", label: "巴音郭楞蒙古自治州" },
      { value: "aksu", label: "阿克苏地区" },
      { value: "kizilsu", label: "克孜勒苏柯尔克孜自治州" },
      { value: "kashgar", label: "喀什地区" },
      { value: "hotan", label: "和田地区" },
      { value: "ili", label: "伊犁哈萨克自治州" },
      { value: "tacheng", label: "塔城地区" },
      { value: "altay", label: "阿勒泰地区" }
    ]
  },
  {
    value: "taiwan",
    label: "台湾省",
    children: [
      { value: "taipei", label: "台北市" },
      { value: "kaohsiung", label: "高雄市" },
      { value: "taichung", label: "台中市" },
      { value: "tainan", label: "台南市" },
      { value: "hsinchu", label: "新竹市" },
      { value: "keelung", label: "基隆市" }
    ]
  },
  {
    value: "hongkong",
    label: "香港特别行政区",
    children: [
      { value: "hongkong", label: "香港特别行政区" }
    ]
  },
  {
    value: "macau",
    label: "澳门特别行政区",
    children: [
      { value: "macau", label: "澳门特别行政区" }
    ]
  }
]; 