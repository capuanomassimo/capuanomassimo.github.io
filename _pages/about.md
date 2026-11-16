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

Welcome! I am a {{ profile.role | downcase }} at the [{{ profile.institution }}]({{ profile.institution_url }}) in {{ profile.location }}.

My research interests include {% for area in site.data.research.areas %}{{ area.title | downcase }}{% unless forloop.last %}, {% endunless %}{% endfor %}.

I hold a Master of Science in Banking and Finance from the [{{ education[1].institution }}]({{ profile.institution_url }}) and a Bachelor's Degree in Business Administration from the [{{ education[4].institution }}](https://www.unipg.it/). I also completed an Erasmus exchange at [{{ education[2].institution }}](https://www.kozminski.edu.pl/) and the Advanced Risk and Portfolio Management (ARPM) Bootcamp.

You can explore my [research](/research/), [publications](/publications/) and [curriculum vitae](/cv/), or consult my [Google Scholar profile]({{ profile.links.google_scholar }}) and [institutional page]({{ profile.links.institutional }}).
