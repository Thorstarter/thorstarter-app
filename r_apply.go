package main

var _ = route("/apply", func(c *C) {
	c.Html(200, layoutSite("Apply", `
<div class="container rich">
  <h1 class="title text-center">Apply for IDO</h1>
  <p class="mt-16">Welcome to Thorstarter. Our goal is to help the broader adoption of innovative blockchain technology. Our IDO model allows users to actively support new projects in a safe and fair manner.</p>
  <p>All projects must go through a careful selection process to ensure quality, working product and safety. The team will conduct thorough due diligence on all applicants.</p>
  <p>If you’re interested in working with Thorstarter please fill out the form below and one of our team members will reach out.</p>
  <p class="text-center mt-16">
    <a class="button" target="_blank" style="padding:20px 32px;font-size:18px;" href="https://docs.google.com/forms/d/e/1FAIpQLSehtUHnoeJng66hdykYKtpMKo0-o_L3GJ9koc12pn_JIjByEQ/viewform?usp=sf_link">Apply for IDO</a>
  </p>
</div>
`))
})