---
layout: single
title: "Research"
permalink: /research/
author_profile: true
description: "Research interests and projects in asset pricing, derivatives, financial risk, digital assets, and sustainable finance."
---
{% assign profile = site.data.academic_profile.profile %}
{% assign research_publications = site.publications | sort: "date" | reverse %}

My research examines financial markets, asset pricing, and the measurement and management of financial risk. The topics below outline the main questions and areas that motivate my current work.

{% for area in site.data.research.areas %}
<section class="research-area" id="{{ area.id }}">
  <h2>{{ area.title }}</h2>
  <p>{{ area.description }}</p>
  {% assign has_related = false %}
  {% for item in research_publications %}
    {% if item.research_areas contains area.id %}
      {% assign has_related = true %}
    {% endif %}
  {% endfor %}
  {% if has_related %}
    <h3>Related work</h3>
    <ul class="research-publications">
      {% for item in research_publications %}
        {% if item.research_areas contains area.id %}
          <li>
            {% if item.paperurl %}
              <a href="{{ item.paperurl }}" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
            {% elsif item.link %}
              <a href="{{ item.link }}" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
            {% else %}
              {{ item.title }}
            {% endif %}
            <span class="research-publication-meta">
              {% if item.display_year %}[{{ item.display_year }}]{% elsif item.date %}[{{ item.date | date: "%Y" }}]{% elsif item.year %}[{{ item.year }}]{% endif %}
              {% if item.type %} · {{ item.type }}{% endif %}
            </span>
          </li>
        {% endif %}
      {% endfor %}
    </ul>
  {% endif %}
</section>
{% endfor %}

<p class="research-note">For a complete list of outputs, see <a href="/publications/">Publications</a>.</p>
