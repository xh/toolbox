### Bug Fixes

* Fixed `portfolio/closingPriceHistory` mishandling its `daysBack` parameter. A one-digit value
  returned the wrong range of days, and a longer value failed with a server error.
* Fixed `portfolio/positions` and `portfolio/livePositions` treating `returnAllGroups=false` as true.
