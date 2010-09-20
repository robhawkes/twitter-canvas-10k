\Twitter. Canvas. 10K.

****************************
An experiment taking my work with HTML5 canvas at Redweb to the next level. Each of the points you see is a Twitter user. Click on a point and you'll see more information about that user. You can also sort the users in different ways. All this in under 10KB of code. Awesome!

****************************

\ Author

****************************
Name: 		Rob Hawkes
Twitter:	@robhawkes
Email: 		rob.hawkes@gmail.com
Website:	http://rawkes.com

****************************


\ Minification

****************************
Unminified files have been left in the "raw" folder. I've tried to keep the minified files readable to a degree, so no sneaky eval() tricks have been used.

****************************


\ Issues

****************************
Due to the unpredictability of the Twitter API I have no control over whether the app will be able to retreive data from their servers. During testing this has only proven a problem when you max out the API rate limit of 150 requests an hour. If I was to re-create this app with a few KB extra I would integrate a higher level of error management.

****************************