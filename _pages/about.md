---
permalink: /
title: "About me"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---
{% assign profile = site.data.academic_profile.profile %}
{% assign education = site.data.academic_profile.education %}
{% assign msc = education | where: "title", "Master of Science in Banking and Finance" | first %}
{% assign bsc = education | where: "title", "Bachelor's Degree in Business Administration" | first %}
{% assign erasmus = education | where: "title", "Erasmus Exchange Programme" | first %}

Welcome! I am a {{ profile.role }} at the [{{ profile.institution }}]({{ profile.institution_url }}) in {{ profile.location }}.

My research interests include asset pricing, derivatives, risk management, and sustainable finance.

I hold a Master of Science in Banking and Finance from the [{{ msc.institution }}]({{ profile.institution_url }}) and a Bachelor's Degree in Business Administration from the [{{ bsc.institution }}](https://www.unipg.it/). I also completed an Erasmus exchange at [{{ erasmus.institution }}](https://www.kozminski.edu.pl/) and the Advanced Risk and Portfolio Management (ARPM) Bootcamp.

You can explore my [research](/research/), [publications](/publications/) and [curriculum vitae](/cv/), or consult my [Google Scholar profile]({{ profile.links.google_scholar }}) and [institutional page]({{ profile.links.institutional }}).
