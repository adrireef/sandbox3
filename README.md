# [ADRIREEF.maps webgis](https://adrireef.github.io/sandbox2/)

This page contains the [ADRIREEF](https://www.italy-croatia.eu/web/adrireef/) (innovative exploitation of Adriatic Reefs in order to strengthen blue economy) Interreg Project webgis. Data comes from a large recognition of infromation on reefs relying on the Adriatic Sea, both from Italian and Croatian coastline. Both natural and artificial reefs and wrecks are considered.

The page is divided in two windows: on the left there is the map where points, identifying reefs, are divided by color in Natural (green) and Artificial reefs (blue) and wrecks (red). Hovering on the reefs with the mouse, Name and Location of the reef appear in the left bottom corner of the map. In the right top corner, the total number of reefs visualized is shown.


![The landing page](https://github.com/adrireef/sandbox2/tree/master/img/webgis_interface.png)

Moreover, when a reef is clicked, a pop up appears reporting relevant information for natural and artificial reefs and wrecks (Figure 2).


![Pop up](https://github.com/adrireef/sandbox2/tree/master/img/popup.png)

In the right part of the page, are reported all the filters we can apply on data. From top to bottom:

* A filter that works by specifying an address and a search radius which returns all the reefs in the nearby of a specified location. This filter can also be useful, for example, for touristic purposes and it returns, in the map window, a zoom to the selected area with evidenced the buffer and the reefs falling in it.
* A filter that finds reefs by Name: this filter can be useful, for example, for reefs’ managers or other administrative and scientific institutions, that wants to find rapidly that specific reef.
* A checkbox filter able to select data by type of reef (natural, artificial or wreck).
* A checkbox filter able to select data by country (Italy and Croatia).
* A slider filtering data by reef depth: this filter works on the bottom depth of the reef (auxiliary column “min_depth_m”). The range of the filter is [0-100] and the default value is 50 m. Once the filter is activated, by moving the slider, the selected value appears in the field “Value”, placed near the slider.
* A slider filtering data by distance from the coastline: this filter works on “min_dist_km” column of the database. The range is [0-20] and the default value is set to 10 km. Once the filter is activated, by moving the slider, the selected value appears in the field “Value”, placed near the slider.
* A dropdown menu filtering data by usage. For this filter, the “exploitation” column is used, and the possible cases are: research, diving/snorkeling, professional fishery, recreational fishery, mariculture and none. The selection of multiple cases is allowed.
* A dropdown menu filtering data by reef typology (only for natual reefs). For this filter, the “reef_typology” column is used, and the possible cases are: patches, ledges, high profile and low profile reefs.
* A dropdown menu filtering data by reef material (only for artificial reefs). For this filter the “material” column is used, and the possible cases are: steel, concrete and rocks.

At the bottom of the page there are:

* Search button, which applies the selected filters.
* Reset button, which resets view and filters.
* List view button that shows, for the visualized reefs, some common information through natural, artificial reefs and wrecks (Figure 3). This button turns to a “Map view” button, when list view is active.


![Table view](https://github.com/adrireef/sandbox2/tree/master/img/tebleview.png)

The project [ADRIREEF](https://www.italy-croatia.eu/web/adrireef/) (innovative exploitation of Adriatic Reefs in order to strengthen blue economy) is funded by the Program Italy-Croatia CBC 2014-2020, Interreg V-A, CUP C66H180020004, CIG 78587941F8;

The template used for this work is [Searchable map lib template - CSV](https://github.com/datamade/searchable-map-template-csv)
