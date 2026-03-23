<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/github.css'
import swift from 'highlight.js/lib/languages/swift'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import c from 'highlight.js/lib/languages/c'
import javascript from 'highlight.js/lib/languages/javascript'
import objectivec from 'highlight.js/lib/languages/objectivec'
import sql from 'highlight.js/lib/languages/sql'
import erlang from 'highlight.js/lib/languages/erlang'
import php from 'highlight.js/lib/languages/php'
import python from 'highlight.js/lib/languages/python'
import ruby from 'highlight.js/lib/languages/ruby'
import bash from 'highlight.js/lib/languages/bash'
import groovy from 'highlight.js/lib/languages/groovy'
import lua from 'highlight.js/lib/languages/lua'
import csharp from 'highlight.js/lib/languages/csharp'
import dart from 'highlight.js/lib/languages/dart'

hljs.registerLanguage('swift', swift)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)
hljs.registerLanguage('c', c)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('objectivec', objectivec)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('erlang', erlang)
hljs.registerLanguage('php', php)
hljs.registerLanguage('python', python)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('groovy', groovy)
hljs.registerLanguage('lua', lua)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('dart', dart)

function hl(code: string, lang: string): string {
  try {
    return hljs.highlight(code.trim(), { language: lang }).value
  } catch {
    return code.trim()
  }
}

interface CodeEntry {
  language: string
  code: string
}

interface TableRow {
  lang: string
  codes: CodeEntry[]
}

const tableData: TableRow[] = [
  {
    lang: 'Swift',
    codes: [{ language: 'swift', code: 'NSDate().timeIntervalSince1970' }],
  },
  {
    lang: 'Go',
    codes: [
      {
        language: 'go',
        code: `import (
  "time"
)
int64(time.Now().Unix())`,
      },
    ],
  },
  {
    lang: 'Java',
    codes: [
      { language: 'java', code: '// pure java\nSystem.currentTimeMillis() / 1000' },
      { language: 'java', code: '// joda java\nDateTime.now().getMillis() / 1000' },
      { language: 'java', code: '// java >= 8\nInstant.now().getEpochSecond()' },
    ],
  },
  {
    lang: 'C',
    codes: [
      {
        language: 'c',
        code: `#include <sys/time.h>

// ...
struct timeval tv;
gettimeofday(&tv, NULL);
// 秒： tv.tv_sec
// 毫秒： tv.tv_sec * 1000LL + tv.tv_usec / 1000`,
      },
    ],
  },
  {
    lang: 'JavaScript',
    codes: [{ language: 'javascript', code: 'Math.round(new Date() / 1000)' }],
  },
  {
    lang: 'Objective-C',
    codes: [{ language: 'objectivec', code: '[[NSDate date] timeIntervalSince1970]' }],
  },
  {
    lang: 'MySQL',
    codes: [{ language: 'sql', code: 'SELECT unix_timestamp(now())' }],
  },
  {
    lang: 'SQLite',
    codes: [{ language: 'sql', code: "SELECT strftime('%s', 'now')" }],
  },
  {
    lang: 'Erlang',
    codes: [
      {
        language: 'erlang',
        code: 'calendar:datetime_to_gregorian_seconds(calendar:universal_time())-719528*24*3600.',
      },
    ],
  },
  {
    lang: 'PHP',
    codes: [
      {
        language: 'php',
        code: `<?php
// pure php
time();`,
      },
      {
        language: 'php',
        code: `<?php
// carbon php
use Carbon\\Carbon;
Carbon::now()->timestamp;`,
      },
    ],
  },
  {
    lang: 'Python',
    codes: [
      { language: 'python', code: 'import time\ntime.time()' },
      { language: 'python', code: 'import arrow\narrow.utcnow().timestamp' },
    ],
  },
  {
    lang: 'Ruby',
    codes: [{ language: 'ruby', code: 'Time.now.to_i' }],
  },
  {
    lang: 'Shell',
    codes: [{ language: 'bash', code: 'date +%s' }],
  },
  {
    lang: 'Groovy',
    codes: [{ language: 'groovy', code: '(new Date().time / 1000).longValue()' }],
  },
  {
    lang: 'Lua',
    codes: [{ language: 'lua', code: 'os.time()' }],
  },
  {
    lang: '.NET/C#',
    codes: [{ language: 'csharp', code: 'DateTimeOffset.UtcNow.ToUnixTimeSeconds();' }],
  },
  {
    lang: 'Dart',
    codes: [
      {
        language: 'dart',
        code: '(new DateTime.now().millisecondsSinceEpoch / 1000).truncate()',
      },
    ],
  },
]
</script>

<template>
  <div class="tool-doc">
    <h3>简介</h3>
    <p>
      时间戳，是从1970年1月1日（UTC/GMT的午夜）开始所经过的秒数（不考虑闰秒），用于表示一个时间点。然而，这种格式对于人类阅读并不友好，因此需要转换成可读的日期和时间格式。这个工具能够将时间戳快速转换为人类可读的日期时间格式，同时也支持反向转换，即将日期时间转换为时间戳。
    </p>

    <h3>北京时间</h3>
    <h4>夏令时</h4>
    <p>
      1986年至1991年，中华人民共和国在全国范围实行了六年夏令时，每年从4月中旬的第一个星期日2时整(北京时间)到9月中旬第一个星期日的凌晨2时整(北京夏令时)。除1986年因是实行夏令时的第一年，从5月4日开始到9月14日结束外，其它年份均按规定的时段施行。夏令时实施期间，将时间向后调快一小时。1992年4月5日后不再实行。
    </p>
    <h4>JDK 的夏令时问题</h4>
    <p>
      夏令时的起止，是政令对日历描述的人为干预。每年均可能发生变化，JDK 如何感知这个规律并在系统上加以体现的？穷举所有变化，并配置在 JDK 中。详见：<a target="_blank"
        href="https://www.oracle.com/java/technologies/tzdata-versions.html">Timezone Data Versions in the JRE
        Software</a>
    </p>
    <p>
      不同版本下 Asia/Shanghai 时区夏令时起始时间不同，早期维护者认为中国标准时间的夏令时切换发生在0时，而后来又经证明发生在2时，新版本 JDK 及时修正了这个问题。
    </p>

    <h3>获取当前时间戳</h3>
    <el-table :data="tableData" stripe border class="code-table">
      <el-table-column prop="lang" label="语言" width="130" align="center" />
      <el-table-column label="代码">
        <template #default="{ row }: { row: TableRow }">
          <pre v-for="(item, idx) in row.codes" :key="idx" class="hljs-pre"
            :class="{ 'mt-2': idx > 0 }"><code class="hljs" v-html="hl(item.code, item.language)" /></pre>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.tool-doc {
  font-size: 14px;
  line-height: 1.8;
  color: #24292f;

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 24px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e8eaed;
    color: #1f2328;

    &:first-child {
      margin-top: 0;
    }
  }

  h4 {
    font-size: 15px;
    font-weight: 600;
    margin: 16px 0 8px;
    color: #1f2328;
  }

  p {
    margin: 0 0 12px;
    color: #57606a;
  }

  a {
    color: #0969da;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .code-table {
    margin-top: 8px;
    font-size: 13px;
  }

  .hljs-pre {
    margin: 0;
    padding: 8px 12px;
    background: #f6f8fa;
    border-radius: 6px;
    overflow-x: auto;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 12.5px;
    line-height: 1.6;
    white-space: pre;

    &.mt-2 {
      margin-top: 8px;
    }

    code {
      background: transparent;
      padding: 0;
      font-size: inherit;
      font-family: inherit;
    }
  }
}
</style>
