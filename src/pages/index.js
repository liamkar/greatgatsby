import React, { useState, useEffect } from "react"
import Layout from "../components/layout"
import News from "../components/news"
import Seo from "../components/seo"

const IndexPage = () => {
  const UNIX_TIME_MULTIPLIER = 1000

  const MAX_VALID_STORIES = 20
  const BATCH_SIZE = 40
  const FOUR_HOURS_IN_MILLISECONDS = 1000 * 60 * 60 * 4
  const MIN_SCORE = 70
  const HACKER_NEWS_TYPE_STORY = "story"

  const CURRENT_TIME = new Date().getTime()
  const OLDEST_POSSIBLE_STORY = CURRENT_TIME - FOUR_HOURS_IN_MILLISECONDS

  const [news, setNews] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      let stories = await fetchStories()
      setNews(stories)
    }
    fetchData()
  }, [])

  async function fetchStories() {
    const response = await fetch(
      "https://hacker-news.firebaseio.com/v0/newstories.json"
    )

    //1.this should get as the latest news ids
    let newStories = await response.json()

    let highScoreNewsFromLast4Hours = []

    let storiesLeft = newStories.length
    let nextBatchStart = 0
    let sliceSize = storiesLeft >= BATCH_SIZE ? BATCH_SIZE : storiesLeft
    let currentBatch = newStories.slice(0, sliceSize)

    let oldestNewsOfTheBatch = CURRENT_TIME
    /*
    so we expect to get latest 500 stories by calling
    https://hacker-news.firebaseio.com/v0/newstories.json
    problem is we dont know anything about this data before inspecting
    more deeply. It might well be that all first 20 of items
    are valid or none of the first 500 are valid based on our criteria.
    So let's choose a polite approach and let's not make all those 500 calls 
    to server, if not really needed, but instead work on 40 item batches.
    Performance wise for our application it would make a lot more sense though
    to make all those 500 calls in one batch, but now we are being very polite
    for hackernews server.
*/
    do {
      let stories = await fetchNewsBatch(currentBatch)
      let validStories = filterValidStories(stories)
      oldestNewsOfTheBatch = stories[stories.length - 1].time
      highScoreNewsFromLast4Hours.push(...validStories)

      //escape do while when clearly iterating the last batch
      //storiesLeft = storiesLeft-sliceSize
      storiesLeft = newStories.length - sliceSize
      if (
        storiesLeft === 0 ||
        sliceSize < BATCH_SIZE ||
        isNewsTooOld(oldestNewsOfTheBatch)
      ) {
        break
      }

      nextBatchStart += BATCH_SIZE
      let sliceAddition = storiesLeft >= BATCH_SIZE ? BATCH_SIZE : storiesLeft
      sliceSize += sliceAddition
      currentBatch = newStories.slice(nextBatchStart, sliceSize)
    } while (highScoreNewsFromLast4Hours.length < MAX_VALID_STORIES)

    /*
      if the latest 500 stories did not yeld at least 20 valid stories let's continue with
      brute force story search based on just given ids. But if we already started to get
      too old news, then we know there would be no reason to try to run this so that is checked first.

      So idea is to just brutally search info of all keys starting from lastStoryId, and once again
      our product is acting very polite and makes api calls in small batches.

      Extra twist in here is that, we have no idea what type of data we will get based on these ids
      in comparison to prev step, we at least knew that all ids were story ids, but now we
      might get comments etc. etc. so in this case we need to filter out also wrong types.
    */
    if (
      highScoreNewsFromLast4Hours.length < MAX_VALID_STORIES &&
      !isNewsTooOld(oldestNewsOfTheBatch)
    ) {
      let lastStoryId = newStories[newStories.length - 1]

      do {
        let batchIds = []
        for (let i = 0; i < BATCH_SIZE; i++) {
          lastStoryId--
          batchIds.push(lastStoryId)
        }
        let storyCandidates = await fetchNewsBatch(batchIds)
        let validStories = filterValidStories(
          storyCandidates,
          HACKER_NEWS_TYPE_STORY
        )
        highScoreNewsFromLast4Hours.push(...validStories)
        oldestNewsOfTheBatch = storyCandidates[storyCandidates.length - 1].time
      } while (
        highScoreNewsFromLast4Hours.length < MAX_VALID_STORIES &&
        !isNewsTooOld(oldestNewsOfTheBatch)
      )
    }

    return limitValidStories(highScoreNewsFromLast4Hours)
  }

  function isNewsTooOld(newsTime) {
    if (newsTime * UNIX_TIME_MULTIPLIER < OLDEST_POSSIBLE_STORY) {
      return true
    }
    return false
  }

  async function fetchNewsBatch(currentBatch) {
    let singleStoryFetches = []
    for (let i = 0; i < currentBatch.length; i++) {
      singleStoryFetches.push(fetchSingleNews(currentBatch[i]))
    }

    let stories = await Promise.all(singleStoryFetches)
    return stories
  }

  function limitValidStories(validStories) {
    if (validStories.length <= MAX_VALID_STORIES) {
      return validStories
    } else {
      return validStories.slice(0, MAX_VALID_STORIES)
    }
  }

  function filterValidStories(stories, typeFilter = "") {
    let validStories = stories.filter(story => {
      if (
        story &&
        (!typeFilter || story.type === typeFilter) &&
        story.score >= MIN_SCORE &&
        story.time * UNIX_TIME_MULTIPLIER >= OLDEST_POSSIBLE_STORY
      ) {
        return true
      }
      return false
    })

    return validStories
  }

  async function fetchSingleNews(id) {
    let response = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`
    )

    let content
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    } else {
      content = await response.json()
    }

    return content
  }

  return (
    <Layout>
      <Seo title="Home" />
      <News news={news} />
    </Layout>
  )
}

export default IndexPage
