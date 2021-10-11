import * as React from "react"

const News = ({ news }) => {
  return (
    <div>
      <h1>Stories</h1>
      {news.map((story, key) => (
        <p key={story.id}>
          {key + 1}.
          <a href={story.url} target="_blank">
            {" "}
            {story.title}
          </a>
        </p>
      ))}
    </div>
  )
}

/*
 const Layout = ({ children }) => {
   const data = useStaticQuery(graphql`
     query SiteTitleQuery {
       site {
         siteMetadata {
           title
         }
       }
     }
   `)
 
   return (
     <>
       <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
       <div
         style={{
           margin: `0 auto`,
           maxWidth: 960,
           padding: `0 1.0875rem 1.45rem`,
         }}
       >
         <main>{children}</main>
         <footer
           style={{
             marginTop: `2rem`,
           }}
         >
           © {new Date().getFullYear()}, Built with
           {` `}
           <a href="https://www.gatsbyjs.com">Gatsby</a>
         </footer>
       </div>
     </>
   )
 }
 
 Layout.propTypes = {
   children: PropTypes.node.isRequired,
 }
 
 export default Layout
 */
export default News
