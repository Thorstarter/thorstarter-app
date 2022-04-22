package main

var _ = route("/brand-kit", func(c *C) {
	c.Html(200, layoutSite("Brand Kit", `
<div class="container rich">
  <h1 class="title text-center">Brand Kit</h1>

  <h2 class="text-center mt-16">Horizontal Logo</h2>
  <div class="flex">
    <div class="flex-auto text-center mr-4">
      <div style="padding:32px;border-radius:var(--border-radius);background:var(--gray3);">
        <img src="/public/brand-kit/horizontal-logo-light.svg" />
      </div>
      <div class="mt-2">
        <a download href="/public/brand-kit/horizontal-logo-light.svg">.svg</a>
        <a download href="/public/brand-kit/horizontal-logo-light.png">.png</a>
      </div>
    </div>
    <div class="flex-auto text-center">
      <div style="padding:32px;border-radius:var(--border-radius);background:var(--white);">
        <img src="/public/brand-kit/horizontal-logo-dark.svg" />
      </div>
      <div class="mt-2">
        <a download href="/public/brand-kit/horizontal-logo-dark.svg">.svg</a>
        <a download href="/public/brand-kit/horizontal-logo-dark.png">.png</a>
      </div>
    </div>
  </div>

  <h2 class="text-center mt-16">Woodmark Logo</h2>
  <div class="flex">
    <div class="flex-auto text-center mr-4">
      <div style="padding:32px;border-radius:var(--border-radius);background:var(--gray3);">
        <img src="/public/brand-kit/woodmark-light.svg" />
      </div>
      <div class="mt-2">
        <a download href="/public/brand-kit/woodmark-light.svg">.svg</a>
        <a download href="/public/brand-kit/woodmark-light.png">.png</a>
      </div>
    </div>
    <div class="flex-auto text-center">
      <div style="padding:32px;border-radius:var(--border-radius);background:var(--white);">
        <img src="/public/brand-kit/woodmark-dark.svg" />
      </div>
      <div class="mt-2">
        <a download href="/public/brand-kit/woodmark-dark.svg">.svg</a>
        <a download href="/public/brand-kit/woodmark-dark.png">.png</a>
      </div>
    </div>
  </div>

  <h2 class="text-center mt-16">Icon Only</h2>
  <div class="flex">
    <div class="flex-auto text-center">
      <div style="padding:32px;border-radius:var(--border-radius);background:var(--gray3);">
        <img src="/public/brand-kit/icon-only.svg" height="150" />
      </div>
      <div class="mt-2">
        <a download href="/public/brand-kit/icon-only.svg">.svg</a>
        <a download href="/public/brand-kit/icon-only.png">.png</a>
      </div>
    </div>
  </div>

  <h2 class="text-center mt-16">Brand Colors</h2>
  <div class="flex">
    <div class="flex-auto text-center mr-4">
      <div style="padding:32px;border-radius:var(--border-radius);background:var(--primary5);color:var(--gray1);">
        <h3 class="mt-0">Cyan</h3>
        <div>#28DBD1</div>
      </div>
    </div>
    <div class="flex-auto text-center mr-4">
      <div style="padding:32px;border-radius:var(--border-radius);background:var(--gray2);color:var(--white);">
        <h3 class="mt-0">Dark Blue</h3>
        <div>#0A1F2F</div>
      </div>
    </div>
  </div>

  <h2 class="text-center mt-16">Typography</h2>
  <div class="flex">
    <div class="flex-auto text-center">
      <div style="padding:32px;border-radius:var(--border-radius);background:var(--white);color:var(--gray2);">
        <h3 class="mt-0">Kohinoor Bangla</h3>
        <a download href="/public/brand-kit/KohinoorBangla.zip">Download .zip</a>
      </div>
    </div>
  </div>

</div>
`))
})
