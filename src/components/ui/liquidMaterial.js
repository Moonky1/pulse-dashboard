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
uniform float palette;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return .62*noise(p)+.30*noise(p*2.07+3.7)+.08*noise(p*4.13+9.1);}
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return min(max(q.x,q.y),0.)+length(max(q,0.))-r;}
float gauss(float x,float w){return exp(-x*x/(w*w));}

// Broad, smoothly blended color stops keep the material luminous, not striped.
vec3 orbEnergy(float phase){
  float band=mod(phase,8.);
  float blend=smoothstep(.08,.92,fract(band));
  vec3 red=vec3(1.,.012,.025), orange=vec3(.96,.30,.045);
  vec3 yellow=vec3(.92,.76,.065), lime=vec3(.46,.79,.07);
  vec3 green=vec3(.035,.67,.31), cyan=vec3(.025,.58,.79);
  vec3 violet=vec3(.53,.29,.78), silver=vec3(.54,.61,.68);
  if(band<1.) return mix(red,orange,blend);
  if(band<2.) return mix(orange,yellow,blend);
  if(band<3.) return mix(yellow,lime,blend);
  if(band<4.) return mix(lime,green,blend);
  if(band<5.) return mix(green,cyan,blend);
  if(band<6.) return mix(cyan,violet,blend);
  if(band<7.) return mix(violet,silver,blend);
  return mix(silver,red,blend);
}

// Environment has spatial features; every RGB channel samples a different ray.
// Softboxes, amber bounce, a blue/cyan bank, dark graphite gaps and narrow strips.
vec3 environment(vec2 q){
  float flow=fbm(q*vec2(.8,1.4)+vec2(time*speed*.13,-time*speed*.07));
  float line=q.y+.22*q.x+.12*flow;
  float bank=smoothstep(-.28,.42,-q.y);
  vec3 warm=mix(vec3(.58,.37,.21),vec3(.58,.73,.85),palette);
  vec3 cool=mix(vec3(.035,.46,.82),vec3(.035,.55,.72),palette);
  warm*=mix(1.,.42,step(.5,shape));
  vec3 tinted=mix(warm,cool,smoothstep(-.6+balance,.7+balance,q.x));
  vec3 col=vec3(.003,.005,.009)+tinted*bank*.65;
  float softbox=(1.-smoothstep(-.82,-.38,line))*( .55+.45*gauss(q.x-.05,1.4));
  col+=mix(vec3(1.08,1.10,1.12),vec3(.72,1.12,1.3),smoothstep(-1.,1.2,q.x))*softbox*1.85;
  col*=1.-.58*gauss(line+.25,.12);
  float thin=gauss(line+.08,.05)+.3*gauss(line+.17,.035);
  col+=vec3(.96,1.04,1.1)*thin*1.25;
  col+=warm*gauss(q.x+1.35,.45)*gauss(q.y+.1,.85)*1.15;
  col+=cool*gauss(q.x-1.4,.8)*gauss(q.y+.25,.85)*1.2;
  float streak=gauss(sin(12.*line+1.1*flow),.22)*gauss(line+.57,.4);
  col+=mix(cool,vec3(.7,1.,1.),.35)*streak*.18;
  float studioAperture=.16+.84*gauss(q.x*.45+q.y+.1,.28);
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
  float split=dispersion*(.55+H)*(.85+min(localCurvature,3.)*.18)*.62;
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
  float hotspot=pow(max(dot(N,halfVector),0.),26.);
  float compression=gauss(localCurvature-1.4,.65)*H;
  vec3 reflected=environment(p*.38+reflect(-V,N).xy*1.8);
  vec3 light=refracted*(.78+.22*coverage);
  light+=reflected*F*fresnel*.60;
  light+=vec3(.9,.96,1.)*hotspot*specular*.5;
  light+=refracted*compression*caustic*.46;
  return light;
}

vec3 ribbon(vec2 p){
  float d=box(p,vec2(aspect()-.035,.95),.91);
  float mask=1.-smoothstep(-.018,.02,d);
  float e=.009;
  float H=heightField(p);
  float hx=heightField(p+vec2(e,0.)),hy=heightField(p+vec2(0.,e));
  float hm=heightField(p-vec2(e,0.)),hn=heightField(p-vec2(0.,e));
  vec2 grad=vec2(hx-hm,hy-hn)/(2.*e);
  float curv=min(3.,abs(hx+hm+hy+hn-4.*H)/(e*e)*.035);
  float depth=crest(p)-p.y;
  float coverage=smoothstep(-.025,.025,depth);
  vec3 glass=refractMaterial(p,H,grad,coverage,curv);
  float live=.27+.73*interaction;
  vec3 graphite=vec3(.003,.0035,.004)+vec3(.003)*gauss(p.y,.7);
  float edge=exp(-abs(d)*90.);
  float foldFocus=gauss(depth-.035,.035)+.2*gauss(depth-.13,.025);
  vec3 col=graphite+glass*coverage*live*exposure*(.75+caustic*foldFocus*1.6);
  col+=vec3(.07,.076,.088)*edge;
  return col*mask;
}

// The radial lens bends light without rotating or pulling the whole ring.
float radialHeight(vec2 p){
  vec2 dp=p-point();
  float dent=exp(-dot(dp,dp)*4.8)*interaction*pointerForce;
  float warp=(fbm(p*3.+vec2(time*speed*.16,time*speed*.10))-.5)*.008;
  float r=length(p)+warp+dent*(.02+.012*press);
  float section=clamp(1.-pow((r-.675)/.083,2.),0.,1.);
  float crossSection=sqrt(section)*smoothstep(0.,.14,section);
  return thickness*.24*crossSection*(.86+.14*fbm(p*4.+time*speed*.14));
}
vec3 orb(vec2 p){
  float r=length(p),e=.006;
  float H=radialHeight(p);
  float hx=radialHeight(p+vec2(e,0)),hm=radialHeight(p-vec2(e,0));
  float hy=radialHeight(p+vec2(0,e)),hn=radialHeight(p-vec2(0,e));
  vec2 gradient=vec2(hx-hm,hy-hn)/(2.*e);
  float curv=min(3.,abs(hx+hm+hy+hn-4.*H)/(e*e)*.035);
  float rim=smoothstep(.003,.021,H);
  float drift=time*speed*4.3;
  vec2 lightDrift=vec2(.80*sin(drift),.62*cos(drift*.72))+point()*interaction*.50;
  vec3 glass=refractMaterial(-p*2.3+vec2(-.14,.28)+lightDrift,H*2.7,gradient,1.,curv);
  float core=1.-smoothstep(.536,.566,r);
  float dome=sqrt(max(0.,1.-r*r/.31));
  vec2 coreLight=vec2(-.17+.18*sin(drift*.68),.25+.15*cos(drift*.54));
  float glint=exp(-dot(p-coreLight,p-coreLight)*80.);
  vec2 sheenPoint=vec2(.10*sin(drift*.57),.08*cos(drift*.46));
  vec2 sheenDistance=(p-sheenPoint)*vec2(.9,1.3);
  float coreSheen=exp(-dot(sheenDistance,sheenDistance)*12.);
  vec3 coreColor=vec3(.009,.013,.019)+vec3(.025,.031,.039)*dome+vec3(.075,.086,.105)*glint+vec3(.010,.015,.022)*coreSheen;
  vec3 backing=vec3(.019,.026,.036)*(1.-smoothstep(.78,.815,r));
  float lip=gauss(r-.785,.008)+.4*gauss(r-.552,.009);
  float response=exp(-dot(p-point(),p-point())*1.1)*interaction;
  // A continuous illuminated body remains visible beneath the moving refraction.
  // The palette travels through eight colors without gaps in the graphite body.
  vec3 energy=orbEnergy(time*speed*3.0+.25+palette*.35);
  float body=smoothstep(.545,.585,r)*(1.-smoothstep(.775,.81,r));
  float swell=.5+.5*sin(p.x*2.8+p.y*1.5+drift*1.25);
  float angle=atan(p.y,p.x);
  float fold=.5+.25*sin(angle*2.2-drift*1.3+.55*sin(angle*1.7+drift*.57))+.25*sin(angle*3.1+drift*.71);
  vec2 lightCenter=vec2(.54*sin(drift*.92),.48*cos(drift*.74));
  float travelingGlow=exp(-dot(p-lightCenter,p-lightCenter)*1.8);
  vec3 foundation=vec3(.035,.05,.067)+energy*(.31+.09*gauss(r-.68,.11)+.17*swell+.25*fold);
  vec3 result=mix(backing,coreColor,core)+foundation*body;
  result+=(vec3(.17,.22,.27)+energy*.14)*body*travelingGlow;
  result+=glass*rim*exposure*(1.05+response*.85)*mix(vec3(.8),energy+vec3(.20),.78);
  result+=(energy*.76+vec3(.10,.15,.20))*body*response;
  vec3 normal=normalize(vec3(-gradient*.32,1.));
  float key=pow(max(dot(normal,normalize(vec3(-.5,.7,.7))),0.),26.);
  float bounce=pow(max(dot(normal,normalize(vec3(.4,-.7,.9))),0.),32.);
  result+=vec3(.82,.94,1.)*(key*1.8+bounce*.9)*specular*rim;
  result+=vec3(.07,.09,.12)*lip;
  return result;
}

void main(){
  vec2 p=(uv*2.-1.)*vec2(aspect(),1.);
  vec3 col=shape>.5?orb(p):ribbon(p);
  // Linear light to display, with controlled white clipping like the reference.
  col=1.-exp(-col*1.5);
  float orbAlpha=1.-smoothstep(.78,.815,length(p));
  float pillAlpha=1.-smoothstep(-.018,.02,box(p,vec2(aspect()-.035,.95),.91));
  gl_FragColor=vec4(pow(col,vec3(.8)),shape>.5?orbAlpha:pillAlpha);
}`
