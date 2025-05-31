// const groups = require("./utility/groups.json");
// const axios = require("axios");

// const iconIds = Object.values(groups).map(group => group.Icon.match(/\d+/)?.[0] || '');
// const iconIdsString = iconIds.join(',');

// axios.get(`https://thumbnails.roblox.com/v1/assets/?assetIds=${iconIdsString}&size=150x150&format=Webp`, {
//     headers: {
//         'x-api-key': "nQ1Xy6GNPE6eJK9am42tLYTGo6HlxSYv053LYbilUtwSlV0GZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNkluTnBaeTB5TURJeExUQTNMVEV6VkRFNE9qVXhPalE1V2lJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaVlYTmxRWEJwUzJWNUlqb2libEV4V0hrMlIwNVFSVFpsU2tzNVlXMDBNblJNV1ZSSGJ6WkliSGhUV1hZd05UTk1XV0pwYkZWMGQxTnNWakJISWl3aWIzZHVaWEpKWkNJNklqSTRNemN6TURnM0lpd2lZWFZrSWpvaVVtOWliRzk0U1c1MFpYSnVZV3dpTENKcGMzTWlPaUpEYkc5MVpFRjFkR2hsYm5ScFkyRjBhVzl1VTJWeWRtbGpaU0lzSW1WNGNDSTZNVGMwTnpVeU9URXlNU3dpYVdGMElqb3hOelEzTlRJMU5USXhMQ0p1WW1ZaU9qRTNORGMxTWpVMU1qRjkua1djSFUyQ013RTFhanFXdmQ0ak9EMDdLLUc2R3hIQXpjMHBDYWpJbUl6ekdXazF0dnlSdU9fSEVCbGRmRHFlMmlDNEp2TkpOV0pobk1DQUEwQ0wtTGtpZFg3OHltVlVQVHl6UllDSFg4Ni1KRjhEaEV2Um5lR2VhOUVqOTJlTHFmYjZwZWl1VmcxdnpFMmppU3lGVE1sY3VLUVhENTFGeUc1bXhDaVc1UTVsUnMzM2FCa1FoOU43RFVzRjlFeG5LZEhVSktCZDAtT2duN1pDOWNmQnZKcjlEU0RkWFp4MlZOclFXcDdBRXR2UkJDaldkX2lsbkxqZU1QTl9Jd2hRUWJPNnhSNElhQlU0MFVlSWp0am1UWjNUOUhtckFWTENwWXhicUw1LUh5a3NITWR6ckg4OV92WUVFQ04xYi1fNUJMMm0tYUlPMDNiMzVBZ3J4cVROOGRR"
//     }
// }).then(response => response.data.data).then(data => {
//   for (const iconData of data) {
//     for (const [name, group] of Object.entries(groups)) {
//       if (iconData.targetId == group.Icon.match(/\d+/)?.[0]) {
//         groups[name].Icon = iconData.imageUrl;
//       }
//     }
//   }
// }).finally(() => {
//   console.log(groups);
// });

const str = '1';
const ste2 = 'no'

console.log(parseInt(str), parseInt(ste2));
