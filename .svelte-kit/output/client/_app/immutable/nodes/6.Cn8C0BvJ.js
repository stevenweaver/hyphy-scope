import"../chunks/CWj6FrbW.js";import"../chunks/O9NtFhcF.js";import{o as se}from"../chunks/Bm-Peyi0.js";import{p as le,f as d,a as r,m as oe,$ as ie,c as e,s,o as _,q as k,r as a,n as i,i as l}from"../chunks/BrBLfwSL.js";import{h as re}from"../chunks/DZG3np5x.js";import{i as g}from"../chunks/kkMc64k_.js";import{h as q}from"../chunks/BtK3TnSR.js";import{i as de}from"../chunks/i3jxjd7U.js";import{H as E}from"../chunks/6OZtexj3.js";import{F as ve}from"../chunks/DDptyUw8.js";import"../chunks/CdoYSR-b.js";import{M as me}from"../chunks/D5aDzweA.js";import{A as ne}from"../chunks/C0VZXULA.js";import{g as M}from"../chunks/CdTtAD6V.js";var pe=d("<p>Loading FEL demo...</p>"),ce=d("<p>Loading MEME demo...</p>"),ue=d("<p>Loading aBSREL demo...</p>"),fe=d(`<section class="svelte-1dekztq"><h1>Component Gallery</h1> <p>Explore all available components in the HyPhy Scope library.</p> <div class="component-showcase svelte-1dekztq"><div class="component-item svelte-1dekztq"><h2>HelloWorld</h2> <p>A simple greeting component for demonstration purposes.</p> <div class="demo-area svelte-1dekztq"><!> <!> <!></div> <details class="svelte-1dekztq"><summary class="svelte-1dekztq">Code Example</summary> <pre class="svelte-1dekztq"><code>&lt;script&gt;
	import &#123; HelloWorld &#125; from 'hyphy-scope';
&lt;/script&gt;

&lt;HelloWorld /&gt;
&lt;HelloWorld name="Scientists" /&gt;</code></pre></details></div> <div class="component-item svelte-1dekztq"><h2>FelVisualization</h2> <p>Interactive visualization for Fixed Effects Likelihood (FEL) analysis results from HyPhy.</p> <div class="demo-area svelte-1dekztq"><div class="fel-preview svelte-1dekztq"><!></div></div> <details class="svelte-1dekztq"><summary class="svelte-1dekztq">Code Example</summary> <pre class="svelte-1dekztq"><code><!></code></pre></details> <p><a href="/fel">→ View full FEL demo</a></p></div> <div class="component-item svelte-1dekztq"><h2>MemeVisualization</h2> <p>Interactive visualization for Mixed Effects Model of Evolution (MEME) analysis results from HyPhy.</p> <div class="demo-area svelte-1dekztq"><div class="meme-preview svelte-1dekztq"><!></div></div> <details class="svelte-1dekztq"><summary class="svelte-1dekztq">Code Example</summary> <pre class="svelte-1dekztq"><code><!></code></pre></details> <p><a href="/meme">→ View full MEME demo</a></p></div> <div class="component-item svelte-1dekztq"><h2>AbsrelVisualization</h2> <p>Interactive visualization for Adaptive Branch-Site Random Effects Likelihood (aBSREL) analysis results from HyPhy.</p> <div class="demo-area svelte-1dekztq"><div class="absrel-preview svelte-1dekztq"><!></div></div> <details class="svelte-1dekztq"><summary class="svelte-1dekztq">Code Example</summary> <pre class="svelte-1dekztq"><code><!></code></pre></details> <p><a href="/absrel">→ View full aBSREL demo</a></p></div> <div class="placeholder svelte-1dekztq"><h2>More Components Coming Soon</h2> <p>This is where we'll showcase:</p> <ul class="svelte-1dekztq"><li>Phylogenetic tree visualizations</li> <li>BUSTED analysis results</li> <li>RELAX analysis results</li> <li>Additional HyPhy methods</li></ul></div></div></section>`);function Le(U,j){le(j,!1);let v=k(null),m=k(null),n=k(null);se(async()=>{_(v,await M("meme")),_(m,await M("fel")),_(n,await M("absrel"))}),de();var p=fe();re(t=>{ie.title="Components - HyPhy Scope"});var w=s(e(p),4),c=e(w),V=s(e(c),4),b=e(V);E(b,{});var F=s(b,2);E(F,{name:"Scientists"});var G=s(F,2);E(G,{name:"Researchers"}),a(V),i(2),a(c);var u=s(c,2),f=s(e(u),4),H=e(f),X=e(H);{var J=t=>{ve(t,{get data(){return l(m)}})},K=t=>{var o=pe();r(t,o)};g(X,t=>{l(m)?t(J):t(K,!1)})}a(H),a(f);var L=s(f,2),D=s(e(L),2),S=e(D),N=e(S);q(N,()=>`&lt;script&gt;
	import { FelVisualization, loadDataFromUrl } from 'hyphy-scope';
	import { onMount } from 'svelte';
	
	let data = null;
	
	onMount(async () => {
		data = await loadDataFromUrl(params.json) ||
		       loadDataFromStorage(params.id) ||
		       defaultData;
	});
&lt;/script&gt;

&lt;FelVisualization {data} /&gt;`),a(S),a(D),a(L),i(2),a(u);var h=s(u,2),z=s(e(h),4),A=e(z),O=e(A);{var Q=t=>{me(t,{get data(){return l(v)}})},Y=t=>{var o=ce();r(t,o)};g(O,t=>{l(v)?t(Q):t(Y,!1)})}a(A),a(z);var x=s(z,2),C=s(e(x),2),P=e(C),Z=e(P);q(Z,()=>`&lt;script&gt;
	import { MemeVisualization } from 'hyphy-scope';
	import { onMount } from 'svelte';
	
	let data = null;
	
	onMount(async () => {
		data = await loadMemeData();
	});
&lt;/script&gt;

&lt;MemeVisualization {data} /&gt;`),a(P),a(C),a(x),i(2),a(h);var R=s(h,2),y=s(e(R),4),T=e(y),$=e(T);{var ee=t=>{ne(t,{get data(){return l(n)}})},ae=t=>{var o=ue();r(t,o)};g($,t=>{l(n)?t(ee):t(ae,!1)})}a(T),a(y);var B=s(y,2),W=s(e(B),2),I=e(W),te=e(I);q(te,()=>`&lt;script&gt;
	import { AbsrelVisualization } from 'hyphy-scope';
	import { onMount } from 'svelte';
	
	let data = null;
	
	onMount(async () => {
		data = await loadAbsrelData();
	});
&lt;/script&gt;

&lt;AbsrelVisualization {data} /&gt;`),a(I),a(W),a(B),i(2),a(R),i(2),a(w),a(p),r(U,p),oe()}export{Le as component};
