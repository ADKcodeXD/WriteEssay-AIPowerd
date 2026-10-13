import { makeAutoObservable } from 'mobx'
import { getTagList } from '@/api/essay'
import { Tables } from '@repo/entity-ts-definition'

export class TagStore {
  tags: Tables<'tag'>[] = []

  constructor() {
    makeAutoObservable(this)
  }

  async fetchTags() {
    try {
      const res = await getTagList({})
      this.tags = res.data || []
    } catch (error) {
      console.error(error)
    }
  }
}
