// FX-1D hybrid experiment over FX-1C. Only A enables the scalar optical map.
export const PRESETS = Object.freeze({
  A: { label: 'Reference-faithful', dispersion: .22, bend: 1.04, thickness: .82, fresnel: .48, specular: .62, caustic: 1.15, noiseScale: 1.8, speed: .24, pointer: .65, absorption: .22, balance: .48, exposure: 1.15 },
  B: { label: 'Pulse-balanced', dispersion: .17, bend: .92, thickness: .77, fresnel: .40, specular: .48, caustic: .88, noiseScale: 1.8, speed: .19, pointer: .5, absorption: .30, balance: .44, exposure: .85 },
  C: { label: 'Minimal', dispersion: .10, bend: .80, thickness: .7, fresnel: .32, specular: .38, caustic: .58, noiseScale: 1.6, speed: .14, pointer: .32, absorption: .38, balance: .42, exposure: .48 },
})

export const vertexSource = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`
export const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time, interaction, press, shape;
uniform float dispersion, bend, thickness, fresnel, specular, caustic;
uniform float noiseScale, speed, pointerForce, absorption, balance, exposure;
uniform sampler2D opticalMap;
uniform float hybridStrength;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return .57*noise(p)+.28*noise(p*2.07+3.7)+.15*noise(p*4.13+9.1);}
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return min(max(q.x,q.y),0.)+length(max(q,0.))-r;}
float gauss(float x,float w){return exp(-x*x/(w*w));}

// Environment has spatial features; every RGB channel samples a different ray.
// Softboxes, amber bounce, a blue/cyan bank, dark graphite gaps and narrow strips.
vec3 ribbonEnvironment(vec2 q){
  float t=time*speed;
  float flow=fbm(q*vec2(.8,1.4)+vec2(t*.13,-t*.07));
  float line=q.y+.22*q.x+.12*flow;
  float bank=1.-smoothstep(-.5,.15,q.y);
  vec3 cool=vec3(.005,.50,1.);
  vec3 warm=vec3(1.,.26,.014);
  float key=gauss(line+.55,.055);
  float secondary=gauss(line+.79,.105);
  float narrow=gauss(line+.09,.013)+.32*gauss(line+.17,.008);
  float left=gauss(q.x+1.30,.75),right=gauss(q.x-1.25,1.0);
  vec3 light=vec3(.002,.003,.005)+cool*bank*.075;
  light+=vec3(1.12,1.13,1.16)*key*(2.6+2.3*left);
  light+=mix(vec3(1.,.98,.88),vec3(.19,.80,1.),smoothstep(-.8,1.,q.x))*secondary*1.15;
  // Warm bounce hugs the key softbox; no broad orange plane.
  light+=warm*max(0.,gauss(line+.55,.098)-key)*left*.85;
  light+=cool*right*(.65*gauss(line+.36,.024)+.30*gauss(line+.93,.035));
  light+=vec3(1.2)*narrow*2.1;
  // A broad transmitted softbox restores volume beneath the narrow focal seams.
  // Its aperture is spatially bounded; exposure and saturation stay unchanged.
  float body=(1.-smoothstep(-.85,-.40,line));
  light+=mix(vec3(1.05,1.,.79),vec3(.12,.82,1.12),smoothstep(-.9+balance*.3,1.1,q.x))*body*1.05;
  light*=1.-.55*gauss(line+.29,.055);
  // Cyan side softbox: transmitted through the same primary/internal rays.
  // A dark gap between apertures keeps the lower bank from reading as flat paint.
  float side=right*gauss(q.y+.18,.78);
  light+=mix(vec3(.008,.28,.95),vec3(.23,1.05,1.25),bank)*side*1.35;
  return light;
}
vec3 environment(vec2 q){
  if(shape<.5)return ribbonEnvironment(q);
  float flow=fbm(q*vec2(.8,1.4)+vec2(time*speed*.13,-time*speed*.07));
  float line=q.y+.22*q.x+.12*flow;
  float bank=smoothstep(-.28,.42,-q.y);
  vec3 warm=vec3(1.,.34,.025), cool=vec3(.008,.48,1.);
  vec3 tinted=mix(warm,cool,smoothstep(-.6+balance,.7+balance,q.x));
  vec3 col=vec3(.003,.005,.009)+tinted*bank*.65;
  float softbox=(1.-smoothstep(-.82,-.38,line))*( .55+.45*gauss(q.x-.05,1.4));
  col+=mix(vec3(1.25,1.16,.94),vec3(.65,1.2,1.5),smoothstep(-1.,1.2,q.x))*softbox*2.2;
  col*=1.-.77*gauss(line+.25,.09);
  float thin=gauss(line+.08,.028)+.45*gauss(line+.17,.016);
  col+=vec3(1.15)*thin*1.8;
  col+=warm*gauss(q.x+1.35,.45)*gauss(q.y+.1,.85)*1.15;
  col+=cool*gauss(q.x-1.4,.8)*gauss(q.y+.25,.85)*1.2;
  float streak=gauss(sin(20.*line+1.1*flow),.13)*gauss(line+.57,.37);
  col+=mix(cool,vec3(.65,1.,1.),.35)*streak*.33;
  float studioAperture=.075+.925*gauss(q.x*.45+q.y+.1,.24);
  return col*mix(1.,studioAperture,step(.5,shape));
}

float aspect(){return resolution.x/resolution.y;}
vec2 point(){return vec2((pointer.x*2.-1.)*aspect(),1.-pointer.y*2.);}

float crest(vec2 p){
  float t=time*speed;
  float n=fbm(vec2(p.x*noiseScale*.48+t*.16,t*.24));
  float n2=fbm(vec2(p.x*1.3-t*.22,t*.12+7.));
  float arch=-.72+.205*p.x*p.x;
  vec2 dp=p-point();
  float pressure=exp(-dot(dp*vec2(.75,1.),dp*vec2(.75,1.))*2.2);
  return arch+(n-.5)*.30+(n2-.5)*.16+interaction*pointerForce*pressure*(.23+press*.27);
}

// H is a rounded solid lens beneath a deforming meniscus, not a color mask.
float heightField(vec2 p){
  float d=box(p,vec2(aspect()-.035,.95),.91);
  float hull=sqrt(clamp(-d/.40,0.,1.));
  float depth=crest(p)-p.y;
  float meniscus=smoothstep(-.025,.115,depth)*(.58+.42*sin(clamp(depth,0.,1.4)*1.12));
  float grain=fbm(p*vec2(.7,2.4)+vec2(time*speed*.17,0.));
  float fold=.72+.24*grain;
  float shift=(grain-.5)*.045;
  // Two actual shallow folds in H. Their derivatives bend the sampled rays.
  float fineFold=.016*gauss(depth-.20-shift,.050)+.007*gauss(depth-.34+shift,.034);
  float micro=.0012*noise(p*vec2(7.,12.)+vec2(time*speed*.31,-time*speed*.23));
  return thickness*hull*(meniscus*fold+fineFold+micro*meniscus)*(1.-press*.12);
}

vec3 refractMaterial(vec2 p,float H,vec2 gradient,float coverage,float localCurvature,vec2 optical){
  vec3 N=normalize(vec3(-gradient*.32,1.));
  vec3 V=normalize(vec3(p*.055,1.));
  float facing=clamp(dot(N,V),0.,1.);
  float F=.045+.955*pow(1.-facing,3.);
  vec2 viewRay=normalize(vec3(p*.16,-1.)).xy;
  float opticalDepth=.24+H*.86;
  float split=dispersion*(.55+H)*(.85+min(localCurvature,3.)*.25);
  if(shape<.5)split=dispersion*(.55+H)*.48;
  vec2 incident=p*vec2(.77,.68)+viewRay*H;
  vec2 g=N.xy*bend*opticalDepth;
  vec2 rRay=incident+g*(1.-split*1.6);
  vec2 gRay=incident+g;
  vec2 bRay=incident+g*(1.+split*2.4);
  vec3 refracted=vec3(environment(rRay).r,environment(gRay).g,environment(bRay).b);
  // Internal reflected ray crosses the same strip light at a different depth.
  // Spectral fringes remain displaced environment samples, not RGB masks.
  vec2 internalRay=incident+g*1.75;
  vec3 internalLight=vec3(environment(internalRay-g*split*2.).r,environment(internalRay).g,environment(internalRay+g*split*3.).b);
  float internalWeight=.34*clamp(length(gradient),0.,1.);
  if(shape<.5)internalWeight=clamp(.12+.20*H+.07*length(gradient),.12,.46);
  if(shape<.5&&hybridStrength>.5)internalWeight=clamp(.12+.48*optical.y+.10*H,.12,.65);
  refracted=mix(refracted,internalLight,internalWeight);
  refracted*=exp(-absorption*H*vec3(.82,.4,.22));
  vec3 halfVector=normalize(vec3(-.18,.58,1.));
  float hotspot=pow(max(dot(N,halfVector),0.),42.);
  float compression=gauss(localCurvature-1.4,.65)*H;
  vec3 reflected=environment(p*.38+reflect(-V,N).xy*1.8);
  vec3 light=refracted*(.78+.22*coverage);
  light+=reflected*F*fresnel*(shape<.5?.24:.60);
  light+=vec3(1.,.96,.86)*hotspot*specular*(shape<.5?.12:.65);
  light+=refracted*compression*caustic*.46;
  return light;
}

vec3 ribbon(vec2 p){
  float d=box(p,vec2(aspect()-.035,.95),.91);
  float mask=1.-smoothstep(-.006,.009,d);
  float e=.009;
  float H=heightField(p);
  float hx=heightField(p+vec2(e,0.)),hy=heightField(p+vec2(0.,e));
  float hm=heightField(p-vec2(e,0.)),hn=heightField(p-vec2(0.,e));
  vec2 grad=vec2(hx-hm,hy-hn)/(2.*e);
  float curv=abs(hx+hm+hy+hn-4.*H)/(e*e)*.035;
  vec2 curvature=vec2(hx+hm-2.*H,hy+hn-2.*H)/(e*e);
  float depth=crest(p)-p.y;
  float coverage=smoothstep(-.025,.025,depth);
  vec2 optical=vec2(0.);
  if(hybridStrength>.5){
    // Two paths through a scalar irradiance map. Coordinates are attached to
    // deformed material depth, not screen UV or direct cursor translation.
    float t=time*speed;
    vec2 warp=vec2(sin(p.y*2.1+sin(t*.61)+p.x*.8),sin(p.x*1.7+cos(t*.47)+H*2.));
    vec2 q=vec2(p.x*.19,depth*.67+H*.21)+warp*vec2(.065,.09)+grad*.008;
    optical.x=texture2D(opticalMap,q).r;
    optical.y=texture2D(opticalMap,q*vec2(.83,1.12)+vec2(.31,.17)+grad*.015+vec2(H*.09,sin(t*.37+p.x)*.043)).r;
  }
  vec3 glass=refractMaterial(p,H,grad,coverage,curv,optical);
  float live=.015+.985*interaction;
  vec3 graphite=vec3(.003,.0035,.004)+vec3(.003)*gauss(p.y,.7);
  float edge=exp(-abs(d)*180.);
  // Diagonal Jacobian proxy of the local ray map: light focuses where nearby
  // rays converge. No arbitrary colored screen-space line is drawn.
  vec2 jacobian=vec2(1.)-curvature*bend*(.012+.020*H);
  float compression=1./(1.+pow(abs(jacobian.x*jacobian.y)*3.2,2.));
  float internalMask=smoothstep(.035,.11,-d)*smoothstep(.025,.10,H);
  float foldFocus=compression*internalMask*smoothstep(.05,.28,length(grad));
  float whiteCore=pow(foldFocus,2.)*min(max(glass.r,max(glass.g,glass.b)),2.);
  vec3 col=graphite+glass*coverage*live*exposure*(.68+caustic*foldFocus*2.8);
  col+=vec3(1.,.985,.955)*whiteCore*caustic*live*.75;
  if(hybridStrength>.5){
    float concentration=pow(optical.x,1.15)*(.55+.9*optical.y);
    float transmitted=.035+.55*optical.x+.28*optical.y;
    float focusing=internalMask*(.3+.7*smoothstep(.08,1.5,curv));
    col=graphite+glass*coverage*live*exposure*transmitted;
    col+=glass*concentration*focusing*caustic*live*6.8;
    // Hot core only where incoming light and geometric/map concentration agree.
    float incoming=clamp(dot(glass,vec3(.21,.72,.07)),0.,1.5);
    col+=vec3(1.,.985,.955)*pow(concentration,1.5)*incoming*focusing*live*caustic*8.;
  }
  col+=vec3(.07,.076,.088)*edge;
  return col*mask;
}

// Radial lens translates the height-field model; illumination stays in world XY.
// It is not an angular color band and no uniform rotates the ring.
float radialHeight(vec2 p){
  vec2 dp=p-point();
  float dent=exp(-dot(dp,dp)*8.)*interaction*pointerForce;
  float warp=(fbm(p*3.+vec2(time*speed*.16,time*speed*.10))-.5)*.017;
  float r=length(p)+warp+dent*(.012+.022*press);
  float crossSection=sqrt(clamp(1.-pow((r-.675)/.083,2.),0.,1.));
  return thickness*.24*crossSection*(.86+.14*fbm(p*4.+time*speed*.14));
}
vec3 orb(vec2 p){
  float r=length(p),e=.0035;
  float H=radialHeight(p);
  float hx=radialHeight(p+vec2(e,0)),hm=radialHeight(p-vec2(e,0));
  float hy=radialHeight(p+vec2(0,e)),hn=radialHeight(p-vec2(0,e));
  vec2 gradient=vec2(hx-hm,hy-hn)/(2.*e);
  float curv=abs(hx+hm+hy+hn-4.*H)/(e*e)*.035;
  float rim=smoothstep(.002,.015,H);
  vec3 glass=refractMaterial(-p*2.3+vec2(-.14,.28),H*2.7,gradient,1.,curv,vec2(0.));
  float core=1.-smoothstep(.548,.554,r);
  float dome=sqrt(max(0.,1.-r*r/.31));
  float glint=exp(-dot(p-vec2(-.17,.25),p-vec2(-.17,.25))*100.);
  vec3 coreColor=vec3(.009,.013,.019)+vec3(.025,.031,.039)*dome+vec3(.06,.075,.10)*glint;
  vec3 backing=vec3(.032,.037,.048)*(1.-smoothstep(.797,.803,r));
  float lip=gauss(r-.785,.004)+.5*gauss(r-.552,.003);
  vec3 result=mix(backing,coreColor,core)+glass*rim*exposure*.88;
  vec3 normal=normalize(vec3(-gradient*.32,1.));
  float key=pow(max(dot(normal,normalize(vec3(-.5,.7,.7))),0.),36.);
  float bounce=pow(max(dot(normal,normalize(vec3(.4,-.7,.9))),0.),48.);
  result+=vec3(1.,.975,.92)*(key*5.2+bounce*2.5)*specular*rim;
  result+=vec3(.07,.09,.12)*lip;
  return result;
}

void main(){
  vec2 p=(uv*2.-1.)*vec2(aspect(),1.);
  vec3 col=shape>.5?orb(p):ribbon(p);
  // Linear light to display, with controlled white clipping like the reference.
  if(shape>.5){col=1.-exp(-col*1.5);col=pow(col,vec3(.8));}
  else {col=max(col-vec3(.002),vec3(0.));col=clamp(col/(1.+col*.72),0.,1.);col=pow(col,vec3(.90));}
  gl_FragColor=vec4(col,1.);
}`
