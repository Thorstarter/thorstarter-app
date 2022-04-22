package main

var _ = route("/jobs", func(c *C) {
	c.Html(200, layoutSite("Jobs", `
<div class="container rich">
  <h1 class="title text-center">Jobs</h1>
  <details>
    <summary>Community & Social Media Manager</summary>
    <p>Thorstarter, a decentralized crosschain launchpad and incubator, is looking for an experienced Community & Social Media Manager to help us grow our ecosystem and generate awareness. The ideal candidate will demonstrate passion for the blockchain industry and will have excellent communication skills. This is a part-time, fully-remote role. Compensation will be paid in USDC/USDT or equivalent stablecoins (cryptocurrency).</p>
    <p>Responsibilities:</p>
    <ul>
      <li>Build and execute strategy to grow our community (AMAs, polls, giveaways, influencers, etc.)</li>
      <li>Oversee Community Moderators</li>
      <li>Manage accounts on various social media platforms, including, but not limited to, Twitter, Telegram, Discord, Forums, etc.</li>
      <li>Source, create, and publish social media content</li>
      <li>Use social media to drive awareness and traffic to our website and partner websites</li>
      <li>Produce reports & measure results</li>
      <li>Launch influencers & third party communities activation activities</li>
      <li>Perform community management & moderation</li>
    </ul>
    <p>Requirements:</p>
    <ul>
      <li>Fluent English speaker</li>
      <li>Able to deliver based on short deadlines and multitask</li>
      <li>2+ years of Marketing experience</li>
      <li>2+ years of experience in the crypto space (plus)</li>
      <li>Digital advertising experience (plus)</li>
    </ul>
    <p>For the right candidate, the role will include additional upside potential in the form of vested tokens.</p>
    <p>We look forward to hearing from you.</p>
    <a class="button" href="mailto:team@thorstarter.org?subject=Community and Social Media Manager">Apply</a>
  </details>
  <details>
    <summary>Research Analyst</summary>
    <p>Thorstarter, a decentralized crosschain launchpad and incubator, is looking for an experienced Research Analyst to help us grow our ecosystem and generate awareness. The ideal candidate will demonstrate passion for the blockchain industry and will have excellent communication skills. This is a part-time, fully-remote role. Compensation will be paid in USDC/USDT or equivalent stablecoins (cryptocurrency).</p>
    <p>Responsibilities:</p>
    <ul>
      <li>Research new ecosystem, IDO, and partner projects for Thorstarter in the crypto space</li>
      <li>Be a first point of contact for interested projects</li>
      <li>Source and pitch dealflow to the Thorstarter team</li>
      <li>Produce reports & measure results</li>
      <li>Cultivate relationships with both new and current partners</li>
      <li>Write summaries of our dealflow for posting on social media</li>
      <li>Oversee traffic on various social media platforms, including, but not limited to, Twitter, Telegram, Discord, Forums, etc.</li>
    </ul>
    <p>Requirements:</p>
    <ul>
      <li>Fluent English speaker</li>
      <li>Able to deliver based on short deadlines and multitask</li>
      <li>2+ years of relevant research experience</li>
      <li>2+ years of experience in the crypto space (plus)</li>
      <li>Digital advertising or business development experience (plus)</li>
      <li>For the right candidate, the role will include additional upside potential in the form of vested tokens.</li>
    </ul>
    <p>We look forward to hearing from you.</p>
    <a class="button" href="mailto:team@thorstarter.org?subject=Research Analyst">Apply</a>
  </details>
</div>
`))
})
