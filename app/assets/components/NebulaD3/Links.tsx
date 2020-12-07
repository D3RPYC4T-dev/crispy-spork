import * as d3 from 'd3';
import _ from 'lodash';
import * as React from 'react';

interface IProps {
  links: any[];
  onUpdataLinks: () => void;
  onMouseInLink: (any) => void;
  onMouseOut: () => void;
}

export default class Links extends React.Component<IProps, {}> {
  ref: SVGGElement;

  componentDidMount() {
    this.linkRender(this.props.links);
  }

  componentDidUpdate(prevProps) {
    const { links } = this.props;
    if (links.length < prevProps.links.length) {
      const removeLinks = _.differenceBy(
        prevProps.links,
        links,
        (v: any) => v.id,
      );
      removeLinks.forEach(removeLink => {
        const id = this.generateId(removeLink);
        d3.select('#text-path-' + id).remove();
        d3.select('#text-marker' + id).remove();
        d3.select('#text-marker-id' + id).remove();
      });
    } else {
      this.linkRender(this.props.links);
    }
  }

  generateId(link) {
    const source = link.source.name || link.source;
    const target = link.target.name || link.target;
    return (
      source +
      link.type +
      target +
      link.edgeProp.tables[0][`${link.type}._rank`]
    );
  }

  linkRender(links) {
    d3.select(this.ref)
      .selectAll('path')
      .data(links)
      .enter()
      .append('svg:path')
      .on('mouseover', (d: any) => {
        this.props.onMouseInLink(d);
      })
      .on('mouseout', () => {
        this.props.onMouseOut();
      })
      .attr('class', 'link')
      .style('stroke', '#999999')
      .style('stroke-opacity', 0.6)
      .attr('id', (d: any) => 'text-path-' + this.generateId(d))
      .style('stroke-width', 2);

    d3.select(this.ref)
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('class', 'text')
      .attr('id', (d: any) => 'text-marker-id' + this.generateId(d))
      .append('textPath')
      .attr('id', (d: any) => 'text-marker' + this.generateId(d))
      .attr('class', 'textPath');

    if (this.ref) {
      this.props.onUpdataLinks();
    }
  }

  render() {
    return (
      <g className="links" ref={(ref: SVGTextElement) => (this.ref = ref)} />
    );
  }
}
