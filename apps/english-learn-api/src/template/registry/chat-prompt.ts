export type BaseMessageFields = { content: unknown }

export class HumanMessage {
  readonly role = 'human'
  readonly content: unknown
  constructor(value: unknown) {
    this.content = (value && typeof value === 'object' && 'content' in value)
      ? (value as { content: unknown }).content
      : value
  }
}

type MessageSpec = [role: 'system' | 'human' | 'ai', template: string]
type MessageInput = MessageSpec | HumanMessage | { role?: string; content: unknown }

function render(template: string, values: Record<string, any>) {
  return template.replace(/\{([\w.-]+)\}/g, (_, key) => {
    const value = values[key]
    return value === undefined || value === null ? '' : String(value)
  })
}

// The prompt files only need message formatting. Keeping this tiny local
// implementation removes the old LangChain runtime from the Worker bundle.
export class ChatPromptTemplate {
  private constructor(private readonly messages: Array<{ role: 'system' | 'human' | 'ai'; template: unknown }>) {}

  static fromMessages(messages: MessageInput[]) {
    return new ChatPromptTemplate(messages.map((message) => {
      if (Array.isArray(message)) return { role: message[0], template: message[1] }
      return { role: (message.role === 'system' ? 'system' : message.role === 'ai' ? 'ai' : 'human'), template: message.content }
    }))
  }

  async formatMessages(values: Record<string, any>) {
    return this.messages.map(({ role, template }) => ({
      role,
      content: typeof template === 'string' ? render(template, values) : template,
      _getType: () => role,
    }))
  }

  async format(values: Record<string, any>) {
    return (await this.formatMessages(values)).map(message => String(message.content)).join('\n\n')
  }
}
