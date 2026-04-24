import type { BaseMessage } from "../types";

const zhCN: BaseMessage = {
  setting: {
    tabs: {
      common: "通用",
      enabledViews: "显示视图",
      annotatedLinks: "注释链接",
      propertyLinks: "属性链接",
      periodicNotes: "周期笔记",
      pinnedContent: "置顶注释",
      folderLinks: "文件夹链接",
    },
    sections: {
      display: "显示",
      enabledViews: "显示视图",
    },
    threeWayDelimiterOptions: {
      full: "完整",
      "full-double-separator": "完整（双分隔符）",
      separator: "分隔符",
      "double-separator": "双分隔符",
      none: "无",
    },
    general: {
      pluginGuide: {
        name: "插件使用说明",
        desc: "先在「显示视图」中选择需要显示导航栏的视图，再到各功能标签页（注释链接 / 属性链接 / 周期笔记 / 文件夹链接）配置链接的数据来源。配置完成后，返回笔记视图即可看到导航栏效果。",
        linkLabel: "查看官方说明与示例",
      },
      matchNavigationWidthToLineLength: {
        name: "让导航栏宽度匹配行宽",
        desc: `启用后，导航栏的宽度会与笔记内容的行宽一致。
这里的「行宽」指的是 Obsidian 启用「Readable line length」时定义的宽度。`,
      },
      displayOrderOfLinks: {
        name: "链接显示顺序",
        desc: `使用前缀字符串（例如 emoji）指定链接显示顺序。例如：{periodic}、{property}、{folder}、🏠、⬆️、📌、🔗。链接会按这里列出的前缀顺序排序。`,
        descTooltip:
          '“{periodic}”、“{property}” 和 “{folder}” 是特殊占位符，分别代表周期笔记链接、上一条/下一条/父级属性链接，以及文件夹链接。',
        tip: "多个前缀请使用英文逗号分隔。",
      },
      propertyNameForDisplayText: {
        name: "作为显示名称的属性名",
        desc: `如果你想用文件属性作为笔记显示文本，请在此填写属性名。
不使用该功能时请留空。`,
        placeholder: "title",
      },
      filterDuplicateLinks: {
        name: "过滤重复链接",
        desc: `当检测到多个目标相同的链接时，自动过滤重复项。
此设置不适用于上一条/下一条/父级类型链接和置顶笔记内容。`,
      },
      duplicateLinkFilteringPriority: {
        name: "重复链接过滤优先级",
        desc: `指定过滤优先级。
例如这里填写 🏠,⬆️,📌,🔗 时，带有「🏠」的链接优先级最高。`,
      },
      itemCollapsePrefixes: {
        name: "折叠前缀",
        desc: `带有下列前缀（例如 emoji）的项目会自动折叠。
你也可以在导航栏中点击前缀来折叠/取消折叠。`,
        tip: "多个前缀请使用英文逗号分隔。",
      },
      mergePrefixes: {
        name: "合并前缀",
        desc: `指定要合并的前缀。例如设置 🔗 后，导航栏中的
🔗[[Note 1]] 🔗[[Note 2]] 🔗[[Note 3]] 会合并为 🔗[[Note 1]] [[Note 2]] [[Note 3]]。`,
        tip: "多个前缀请使用英文逗号分隔。",
      },
      displayLoadingMessage: {
        name: "显示加载提示",
        desc: `链接加载过程中，在导航栏显示加载提示（加载中……）。`,
      },
      displayPlaceholder: {
        name: "显示占位提示",
        desc: `当没有可显示内容时，显示占位提示（无链接）。`,
      },
      confirmFileCreation: {
        name: "创建新文件时确认",
        desc: `创建新文件时显示确认对话框。
该选项当前仅用于周期笔记。`,
      },
      trimWhitespaceInInputFields: {
        name: "裁剪输入字段首尾空白",
        desc: `启用后，会自动去除下方设置中输入字符串的首尾空白。
如果你需要保留空格，请关闭此选项。`,
        descTooltip: `受影响设置：{affectedSettings}。`,
        affectedSettings: [
          "链接显示顺序",
          "重复链接过滤优先级",
          "折叠前缀",
          "合并前缀",
          "反向链接注释字符串",
          "当前笔记注释字符串",
          "反向链接高级注释字符串",
          "当前笔记高级注释字符串",
          "上一条笔记属性映射",
          "下一条笔记属性映射",
          "父级笔记属性映射",
          "链接前缀（周期笔记链接）",
          "注释字符串（置顶笔记内容）",
          "起始标记",
          "结束标记",
          "包含模式",
          "排除模式",
          "链接前缀（文件夹链接）",
        ],
      },
    },
    displayTargets: {
      heading: "显示视图",
      inPanes: {
        name: "窗格",
        desc: `在笔记以窗格形式打开时显示导航栏。
该设置作用于笔记容器（窗格）。`,
        tip: "要真正显示导航栏，还需要启用下方对应视图类型的选项。",
      },
      inPagePreviews: {
        name: "页面预览",
        desc: `在页面预览中显示笔记时显示导航栏。
该设置作用于笔记容器（页面预览）。`,
        tip: "要真正显示导航栏，还需要启用下方对应视图类型的选项。",
      },
      inMarkdownViews: {
        name: "Markdown 视图",
        desc: "查看 Markdown 文档时显示导航栏。",
      },
      inImageViews: {
        name: "图片视图",
        desc: "查看图片时显示导航栏。",
      },
      inVideoViews: {
        name: "视频视图",
        desc: "查看视频时显示导航栏。",
      },
      inAudioViews: {
        name: "音频视图",
        desc: "查看音频时显示导航栏。",
      },
      inPdfViews: {
        name: "PDF 视图",
        desc: "查看 PDF 时显示导航栏。",
      },
      inCanvasViews: {
        name: "Canvas 视图",
        desc: "查看 Canvas 时显示导航栏。",
      },
      inBasesViews: {
        name: "Bases 视图",
        desc: "查看 Bases 时显示导航栏。",
      },
      inOtherViews: {
        name: "其他视图",
        desc: `在其他视图（如社区插件引入的视图）中显示导航栏。
是否生效取决于具体视图类型。`,
      },
    },
    annotatedLinks: {
      heading: "注释链接",
      annotationStringsForBacklinks: {
        name: "反向链接注释字符串",
        desc: `定义注释字符串。
如果在笔记内容中，链接前紧邻某个注释字符串（例如 emoji），
该链接会被识别为注释链接。
包含注释链接的笔记会显示在目标笔记导航栏的反向链接中。
只要后续内容可被识别为链接（Wikilink 或 Markdown 链接），
任意字符串（包括 emoji）都可以作为注释字符串。
如果不使用此功能，请留空。`,
        tip: "多个注释请用英文逗号分隔，例如 📌,🔗。",
      },
      annotationStringsForBacklinksTooltip: `{emojiPlaceholder} 可作为特殊占位符，表示任意单个 emoji。
例如仅填写 {emojiPlaceholder} 时，所有前面带 emoji 的链接都会匹配。
它也可以与其他条目混用，例如 {emojiPlaceholder}📌,🔗。`,
      annotationStringsForCurrentNote: {
        name: "当前笔记注释字符串",
        desc: `定义当前笔记中链接使用的注释字符串。
该设置与「反向链接注释字符串」相同，但作用于当前笔记内的链接。`,
      },
      hidePrefixes: {
        name: "在导航栏中隐藏前缀",
        desc: "启用后，导航栏中的前缀（例如 emoji）将被隐藏。",
      },
      advancedAnnotationStringsForBacklinks: {
        name: "反向链接高级注释字符串",
        desc: `「反向链接注释字符串」的高级版本。
该设置允许用正则表达式作为注释字符串，并指定任意前缀（例如 emoji）
用于导航栏显示。
每行输入一条映射，格式为 regex:prefix。
若前缀中需要冒号，请使用 "\\:" 转义。
前缀也可以为空字符串。`,
        placeholder: "📌:🔗\n(?:^|\\n)-:\n\\[\\[E\\]\\]:🔗",
      },
      advancedAnnotationStringsForCurrentNote: {
        name: "当前笔记高级注释字符串",
        desc: `「当前笔记注释字符串」的高级版本。`,
        tip: "语法与「反向链接高级注释字符串」一致。",
      },
      allowSpaceAfterAnnotationString: {
        name: "允许注释字符串与链接之间有空格",
        desc: `启用后，即使注释字符串与链接之间有空格，链接仍会被识别为注释链接。`,
      },
      ignoreVariationSelectors: {
        name: "忽略变体选择符",
        desc: "启用后，匹配链接时会忽略 emoji 变体选择符（VS15/VS16）。",
      },
    },
    propertyLinks: {
      heading: "属性链接",
      propertyMappings: {
        name: "属性映射",
        desc: `定义从属性映射的链接关系。
如果这里指定的文件属性指向某个笔记，该笔记会显示在导航栏中（也支持网站 URL）。
每条映射由属性名和一个前缀字符串组成，当前缀链接出现在导航栏时会显示该字符串（如果想作为图标显示，可使用 emoji）。
每行格式为 property_name:prefix。`,
        tip: `若前缀中需要冒号，请使用 \\: 转义。
前缀也可以为空字符串。
如果不使用此功能，请留空。`,
        placeholder: "up:⬆️\nhome:🏠",
      },
      previousNotePropertyMappings: {
        name: "上一条笔记属性映射",
        desc: `输入用于指定上一条笔记的映射。这里指定的笔记会在导航栏中显示为
< previous | parent | next >。`,
        tip: "语法与「属性映射」相同。",
        placeholder: "previous:",
      },
      nextNotePropertyMappings: {
        name: "下一条笔记属性映射",
        desc: `输入用于指定下一条笔记的映射。这里指定的笔记会在导航栏中显示为
< previous | parent | next >。`,
        tip: "语法与「属性映射」相同。",
        placeholder: "next:",
      },
      parentNotePropertyMappings: {
        name: "父级笔记属性映射",
        desc: `输入用于指定父级笔记的映射。这里指定的笔记会在导航栏中显示为
< previous | parent | next >。`,
        tip: "语法与「属性映射」相同。",
        placeholder: "parent:\nup:",
      },
      linkDisplayStyle: {
        name: "链接显示样式",
        desc: `指定导航栏中上一条/下一条/父级链接的显示样式。
完整：< previous | parent | next >，
完整（双分隔符）：< previous || parent || next >，
分隔符：previous | parent | next，
双分隔符：previous || parent || next，
无：previous parent next。`,
      },
      implicitReciprocalPropertyPairs: {
        name: "隐式互反属性对",
        desc: `在这里指定属性名对，可在导航栏中隐式创建互反链接。
例如输入 prev:next 后，当笔记 A 有属性 "next: [[笔记 B]]" 时，
即使未显式设置，笔记 B 也会被视为拥有 "prev: [[笔记 A]]"。
每行输入一对。`,
        placeholder: "prev:next\nparent:child",
      },
    },
    periodicNotes: {
      heading: "周期笔记链接",
      sections: {
        daily: "日记",
        weekly: "周记",
        monthly: "月记",
        quarterly: "季记",
        yearly: "年记",
      },
      displayPrevNextInDailyNotes: {
        name: "在日记中显示上一条和下一条链接",
        desc: `使用此选项前，请先在 Daily Notes 插件或 Periodic Notes 插件中启用日记。`,
      },
      parentForDailyNotes: { name: "日记的父级" },
      displayPrevNextInWeeklyNotes: {
        name: "在周记中显示上一条和下一条链接",
        desc: "使用此选项前，请先在 Periodic Notes 插件中启用周记。",
      },
      parentForWeeklyNotes: { name: "周记的父级" },
      displayPrevNextInMonthlyNotes: {
        name: "在月记中显示上一条和下一条链接",
        desc: "使用此选项前，请先在 Periodic Notes 插件中启用月记。",
      },
      parentForMonthlyNotes: { name: "月记的父级" },
      displayPrevNextInQuarterlyNotes: {
        name: "在季记中显示上一条和下一条链接",
        desc: "使用此选项前，请先在 Periodic Notes 插件中启用季记。",
      },
      parentForQuarterlyNotes: { name: "季记的父级" },
      displayPrevNextInYearlyNotes: {
        name: "在年记中显示上一条和下一条链接",
        desc: "使用此选项前，请先在 Periodic Notes 插件中启用年记。",
      },
      linkDisplayStyle: {
        name: "链接显示样式",
        desc: `指定导航栏中链接的显示样式。
完整：< previous | parent | next >，
完整（双分隔符）：< previous || parent || next >，
分隔符：previous | parent | next，
双分隔符：previous || parent || next，
无：previous parent next。`,
      },
      linkPrefix: {
        name: "链接前缀",
        desc: "显示在每个链接前的字符串（例如 emoji）。",
      },
      granularityOptions: {
        none: "无",
        week: "周记",
        month: "月记",
        quarter: "季记",
        year: "年记",
      },
    },
    pinnedContent: {
      heading: "置顶注释",
      annotationStrings: {
        name: "注释字符串",
        desc: `在导航栏中显示当前笔记的一部分内容。
显示文本会从指定注释字符串后立即开始，一直持续到该行末尾。
如果注释字符串后紧跟下方定义的起始和结束标记，
则只显示这两个标记之间的内容。
示例：
📌[[note 1]]/[[note 2]](行末) → 📌[[note 1]]/[[note 2]]，
📌([[note 1]]/[[note 2]])[[note 3]] → 📌[[note 1]]/[[note 2]]。`,
        tip: "多个注释请用英文逗号分隔。",
        placeholder: "📌,🔗",
      },
      startMarker: { name: "起始标记", placeholder: "(" },
      endMarker: { name: "结束标记", placeholder: ")" },
      ignoreCodeBlocks: {
        name: "忽略代码块",
        desc: "启用后，搜索置顶内容时会忽略代码块。",
      },
    },
    folderLinks: {
      heading: "文件夹链接",
      intro: {
        desc: `创建文件夹链接规则，在导航栏中显示特定文件夹内的文件链接。
你可以添加多个规则，每个规则都有自己的配置选项。`,
        tip: `提示：点击规则名称可以重命名。`,
      },
      folderSettingHeading: (index: number) => `文件夹设置 #${index}`,
      folderPaths: {
        name: "文件夹路径",
        desc: `对这里指定的每个文件夹，若当前打开文件位于该文件夹中，
同文件夹中的文件会显示在导航栏里。可指定多个文件夹
（每行一个路径）。支持 Glob 模式
（例如 **：所有文件夹；*：根目录下一级所有文件夹；
folder/*：folder 下一级所有文件夹）。`,
        placeholder: "path/to/the/folder\nanother/folder/*",
      },
      excludedFolderPaths: {
        name: "排除的文件夹路径",
        desc: `指定要排除的文件夹路径。可指定多个文件夹
（每行一个路径）。支持 Glob 模式。`,
        placeholder: "path/to/the/folder\nanother/folder/*",
      },
      recursive: {
        name: "递归",
        desc: "是否包含子文件夹中的文件。",
      },
      includePatterns: {
        name: "包含模式",
        desc: `部分匹配这些模式的文件会被包含。每行一个。
留空则包含所有文件。`,
        placeholder: "Chapter\n.pdf",
      },
      excludePatterns: {
        name: "排除模式",
        desc: "部分匹配这些模式的文件会被排除。每行一个。",
        placeholder: ".canvas",
      },
      enableRegex: {
        name: "启用正则表达式",
        desc: "是否在包含/排除模式中启用正则表达式。",
      },
      filterBy: {
        name: "筛选依据",
        desc: "指定包含/排除模式基于文件名还是属性值。",
        options: {
          filename: "文件名",
          property: "属性",
        },
      },
      propertyNameToFilterBy: {
        name: "用于筛选的属性名",
        desc: `用于筛选的属性名。
当「筛选依据」设为「属性」时，此项必填。`,
      },
      sortOrder: {
        name: "排序顺序",
        options: {
          asc: "升序",
          desc: "降序",
        },
      },
      sortBy: {
        name: "排序依据",
        options: {
          filename: "文件名",
          created: "创建时间",
          modified: "修改时间",
          property: "属性",
        },
      },
      propertyNameToSortBy: {
        name: "用于排序的属性名",
        desc: `用于排序的属性名。
当「排序依据」设为「属性」时，此项必填。`,
      },
      maxLinks: {
        name: "最大链接数",
        desc: `显示的文件夹链接最大数量。
例如设为 3 时，显示形态类似
<prev3 prev2 prev1 | parent | next1 next2 next3>。`,
      },
      pathToParentNote: {
        name: "父级笔记路径",
        placeholder: "path/to/the/note.md",
      },
      linkDisplayStyle: {
        name: "链接显示样式",
        desc: `指定导航栏中上一条/下一条/父级链接的显示样式。
完整：< previous | parent | next >，
完整（双分隔符）：< previous || parent || next >，
分隔符：previous | parent | next，
双分隔符：previous || parent || next，
无：previous parent next。`,
      },
      linkPrefix: {
        name: "链接前缀",
        desc: "显示在每个链接前的字符串（例如 emoji）。",
      },
      controls: {
        rename: "重命名",
        expand: "展开",
        collapse: "折叠",
        pinToTop: "置顶",
        moveUp: "上移",
        moveDown: "下移",
        remove: "移除",
        addFolderSetting: "添加文件夹设置",
      },
    },
  },
  command: {
    openPreviousPropertyLink: "打开上一条属性链接",
    openNextPropertyLink: "打开下一条属性链接",
    openParentPropertyLink: "打开父级属性链接",
    openPreviousPeriodicNote: "打开上一条周期笔记",
    openNextPeriodicNote: "打开下一条周期笔记",
    openParentPeriodicNote: "打开父级周期笔记",
    openPreviousFolderLink: "打开上一条文件夹链接",
    openNextFolderLink: "打开下一条文件夹链接",
    openParentFolderLink: "打开父级文件夹链接",
    openPreviousAny: "打开上一条链接（任意类型）",
    openNextAny: "打开下一条链接（任意类型）",
    openParentAny: "打开父级链接（任意类型）",
    toggleMatchNavigationWidth: "切换「让导航栏宽度匹配行宽」",
  },
  modal: {
    createNewNote: "创建新笔记",
    fileNotExist: (fileTitle: string) =>
      `文件「${fileTitle}」不存在。确定要创建新笔记吗？`,
    create: "创建",
    createDontAskAgain: "创建（不再询问）",
    save: "保存",
    cancel: "取消",
  },
  ui: {
    loading: "加载中……",
    noLinks: "无链接",
    collapsedCount: (itemCount: number) => `（${itemCount} 项）`,
  },
};

export default zhCN;
