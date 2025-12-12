import { AI_API_URL, AI_API_KEY, AI_MODEL, SYSTEM_PROMPT, TIP_PROMPT, DEFAULT_AI_MODEL } from '../constants';
import { ReviewResult } from '../types';


export const fetchDailyTip = async (): Promise<string> => {
  try {
    let model = DEFAULT_AI_MODEL
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: TIP_PROMPT },
          { role: 'user', content: `请随意输出，文本两边不要加引号` }
        ],
        temperature: 0.85,
        top_p: 0.92,
        seed: Math.floor(Math.random() * 10000),
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`AI 服务响应错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let content = ''
    if (model === 'info') {
      content = data.output.text
    } else {
      content = data.choices?.[0]?.message?.content;
    }
    return content ? content.replace(/^["']|["']$/g, '') : "编程提示：代码能跑就不要动。";

  } catch (e) {
    console.warn("Failed to fetch tip", e);
    return "友情提示：猫耳最帅的人是菜菜头";
  }
};

export const analyzeDiff = async (diffContent: string): Promise<ReviewResult> => {
  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `请审查以下 git diff:\n\n${diffContent}` }
        ],
        temperature: 0.2,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`AI 服务响应错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let content = ''
    // Support standard OpenAI-compatible response structure
    if (AI_MODEL === 'info') {
      content = data.output.text
    } else {
      content = data.choices?.[0]?.message?.content;
    }

    if (!content) {
      throw new Error("AI 返回了空内容");
    }

    // 尝试解析 JSON。AI 可能会错误地用 markdown 包裹 json
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;

    try {
      const parsed: ReviewResult = JSON.parse(jsonString);
      return parsed;
    } catch (e) {
      console.error("JSON Parse Error", e);
      // 如果 AI 未能返回严格的 JSON，降级处理
      return {
        summary: "无法解析 AI 返回的格式，以下是原始内容：",
        issues: [{ severity: 'low', description: content, suggestion: '请检查 AI 服务配置' }],
        score: 0,
        refactoredCode: ''
      };
    }

  } catch (error: any) {
    console.error("Analysis Failed", error);
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("无法连接到本地 AI 服务 (http://127.0.0.1:3128)。请确保服务已启动并允许跨域 (CORS) 请求。");
    }
    throw error;
  }
};