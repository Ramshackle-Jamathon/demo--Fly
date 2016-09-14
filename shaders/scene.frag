//Distance field functions found here : http://www.iquilezles.org/www/articles/distfunctions/distfunctions.html
precision mediump float;

uniform float uGlobalTime;
uniform vec2 uResolution;

uniform vec3 uCamPosition;
uniform vec3 uCamDir;
uniform vec3 uCamUp;

varying vec2 uv;
#define FieldOfView 1.0

//-----------------Operation functions--------------------

//Union operation (d1 + d2)
float opU(float d1, float d2)
{
	return min(d1,d2);   
}

//Subtraction operation (d1 - d2)
float opS(float d1, float d2)
{
	return max(-d1,d2);   
}

//Intersection operation (only shows the primitives that intersect)
float opI(float d1, float d2)
{
	return max(d1,d2);
}

//Changes the colour based on it's distance from the camera
float opFog(float p)
{
	return 1.0 / (1.0 * p * p * 0.05);   
}

//Repeats the primitive across the coordinate space (p = point along ray, c = dimensions of repetition)
vec3 opRepeat(vec3 p, vec3 c)
{
	vec3 q = mod(p,c) - 0.5 * c;
	return q;
}

//-----------------Distance field functions--------------------

//Distance field function for a torus primitive (p = point along ray, t = dimesions of torus (inner radius, outer radius))
float rTorus(vec3 p, vec2 t)
{
	vec3 q = fract(p) * 2.0 - 1.0;
	
	vec2 s = vec2(length(q.xz) - t.x,q.y);
	return length(s)-t.y;
}
//-----------------Main functions--------------------

//Main tracing function that maps the distances of each pixel
float trace(vec3 ro, vec3 rt)
{
	float t = 0.0;
	
	//Loop through (in this case 32 times)
	for(int i = 0; i < 32; ++i)
	{
		//Get the point along the ray
		vec3 p = ro + rt * t;

		float n = abs(sin(uGlobalTime));
		p.y *= n;
		//Get the value for the distance field
		float d = rTorus(p, vec2(1.0, -0.1));

		t += d * 0.5;
	}
	return t;
}

void main()
{

	vec2 coord = uv;
	coord.x *= uResolution.x / uResolution.y;


	// Camera position (eye), and camera target
	vec3 camPos = vec3(uCamPosition.x,uCamPosition.y,uCamPosition.z);
	vec3 target = camPos+vec3(uCamDir.x,uCamDir.y,uCamDir.z);
	vec3 camUp  = vec3(uCamUp.x,uCamUp.y,uCamUp.z);
	
	// Calculate orthonormal camera reference system
	vec3 camDir   = normalize(target-camPos); // direction for center ray
	camUp = normalize(camUp-dot(camDir,camUp)*camDir); // orthogonalize
	vec3 camRight = normalize(cross(camDir,camUp));
	
	
	// Get direction for this pixel
	vec3 rayDir = normalize(camDir + (coord.x*camRight + coord.y*camUp)*FieldOfView);

	//Call the main trace function and get a value
	float t = trace(camPos,rayDir);

	//Call the fogging function to apply some depth to the image
	t = opFog(t);

	gl_FragColor = vec4(t,0.0,0.0,1.0);
}
