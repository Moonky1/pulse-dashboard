// FX-1B's original height-field material, selectively adapted for Pulse product use.

export const vertexSource = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`
export const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time, interaction, press, shape;
uniform float dispersion, bend, thickness, fresnel, specular, caustic;
uniform float noiseScale, speed, pointerForce, absorption, balance, exposure;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return .57*noise(p)+.28*noise(p*2.07+3.7)+.15*noise(p*4.13+9.1);}
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return min(max(q.x,q.y),0.)+length(max(q,0.))-r;}
float gauss(float x,float w){return exp(-x*x/(w*w));}

// Environment has spatial features; every RGB channel samples a different ray.
// Softboxes, amber bounce, a blue/cyan bank, dark graphite gaps and narrow strips.
vec3 environment(vec2 q){
  float flow=fbm(q*vec2(.8,1.4)+vec2(time*speed*.13,-time*speed*.07));
  float line=q.y+.22*q.x+.12*flow;
  float bank=smoothstep(-.28,.42,-q.y);
  vec3 warm=vec3(.72,.45,.19), cool=vec3(.008,.48,1.);
  warm*=mix(1.,.42,step(.5,shape));
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
  float pressure=exp(-dot(dp*vec2(.75,1.),dp*vec2(.75,1.))*1.65);
  return arch+(n-.5)*.30+(n2-.5)*.16+interaction*pointerForce*pressure*(.32+press*.23);
}

// H is a rounded solid lens beneath a deforming meniscus, not a color mask.
float heightField(vec2 p){
  float d=box(p,vec2(aspect()-.035,.95),.91);
  float hull=sqrt(clamp(-d/.40,0.,1.));
  float depth=crest(p)-p.y;
  float meniscus=smoothstep(-.025,.115,depth)*(.58+.42*sin(clamp(depth,0.,1.4)*1.12));
  float fold=.72+.24*fbm(p*vec2(.7,2.4)+vec2(time*speed*.17,0.));
  return thickness*hull*meniscus*fold*(1.-press*.12);
}

vec3 refractMaterial(vec2 p,float H,vec2 gradient,float coverage,float localCurvature){
  vec3 N=normalize(vec3(-gradient*.32,1.));
  vec3 V=normalize(vec3(p*.055,1.));
  float facing=clamp(dot(N,V),0.,1.);
  float F=.045+.955*pow(1.-facing,3.);
  vec2 viewRay=normalize(vec3(p*.16,-1.)).xy;
  float opticalDepth=.24+H*.86;
  float split=dispersion*(.55+H)*(.85+min(localCurvature,3.)*.25);
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
  refracted=mix(refracted,internalLight,.34*clamp(length(gradient),0.,1.));
  refracted*=exp(-absorption*H*vec3(.82,.4,.22));
  vec3 halfVector=normalize(vec3(-.18,.58,1.));
  float hotspot=pow(max(dot(N,halfVector),0.),42.);
  float compression=gauss(localCurvature-1.4,.65)*H;
  vec3 reflected=environment(p*.38+reflect(-V,N).xy*1.8);
  vec3 light=refracted*(.78+.22*coverage);
  light+=reflected*F*fresnel*.60;
  light+=vec3(1.,.96,.86)*hotspot*specular*.65;
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
  float depth=crest(p)-p.y;
  float coverage=smoothstep(-.025,.025,depth);
  vec3 glass=refractMaterial(p,H,grad,coverage,curv);
  float live=.10+.90*interaction;
  vec3 graphite=vec3(.003,.0035,.004)+vec3(.003)*gauss(p.y,.7);
  float edge=exp(-abs(d)*180.);
  float foldFocus=gauss(depth-.035,.018)+.28*gauss(depth-.13,.012);
  vec3 col=graphite+glass*coverage*live*exposure*(.75+caustic*foldFocus*1.6);
  col+=vec3(.07,.076,.088)*edge;
  return col*mask;
}

// Radial lens translates the height-field model; illumination stays in world XY.
// It is not an angular color band and no uniform rotates the ring.
float radialHeight(vec2 p){
  vec2 dp=p-point();
  float dent=exp(-dot(dp,dp)*4.8)*interaction*pointerForce;
  float warp=(fbm(p*3.+vec2(time*speed*.16,time*speed*.10))-.5)*.017;
  float r=length(p)+warp+dent*(.075+.026*press);
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
  vec3 glass=refractMaterial(-p*2.3+vec2(-.14,.28),H*2.7,gradient,1.,curv);
  float core=1.-smoothstep(.548,.554,r);
  float dome=sqrt(max(0.,1.-r*r/.31));
  float glint=exp(-dot(p-vec2(-.17,.25),p-vec2(-.17,.25))*100.);
  vec3 coreColor=vec3(.009,.013,.019)+vec3(.025,.031,.039)*dome+vec3(.06,.075,.10)*glint;
  vec3 backing=vec3(.019,.026,.036)*(1.-smoothstep(.797,.803,r));
  float lip=gauss(r-.785,.004)+.5*gauss(r-.552,.003);
  float response=exp(-dot(p-point(),p-point())*4.2)*interaction;
  vec3 result=mix(backing,coreColor,core)+glass*rim*exposure*(.88+response*.48);
  vec3 normal=normalize(vec3(-gradient*.32,1.));
  float key=pow(max(dot(normal,normalize(vec3(-.5,.7,.7))),0.),36.);
  float bounce=pow(max(dot(normal,normalize(vec3(.4,-.7,.9))),0.),48.);
  result+=vec3(.85,.98,1.)*(key*2.3+bounce*1.1)*specular*rim;
  result+=vec3(.07,.09,.12)*lip;
  return result;
}

void main(){
  vec2 p=(uv*2.-1.)*vec2(aspect(),1.);
  vec3 col=shape>.5?orb(p):ribbon(p);
  // Linear light to display, with controlled white clipping like the reference.
  col=1.-exp(-col*1.5);
  float orbAlpha=1.-smoothstep(.79,.805,length(p));
  float pillAlpha=1.-smoothstep(-.006,.009,box(p,vec2(aspect()-.035,.95),.91));
  gl_FragColor=vec4(pow(col,vec3(.8)),shape>.5?orbAlpha:pillAlpha);
}`
