/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';
import { IExtension, IExtensionsService, IGalleryService } from 'vs/workbench/parts/extensions/common/extensions';
import { TPromise } from 'vs/base/common/winjs.base';
import * as semver from 'semver';

'use strict';

export function getExtensionId(extension: IExtension): string {
	return `${ extension.publisher }.${ extension.name }`;
}

export function extensionEquals(one: IExtension, other: IExtension): boolean {
	return one.publisher === other.publisher && one.name === other.name;
}

export function getTelemetryData(extension: IExtension): any {
	return {
		id: getExtensionId(extension),
		name: extension.name,
		galleryId: extension.galleryInformation ? extension.galleryInformation.id : null,
		publisherId: extension.galleryInformation ? extension.galleryInformation.publisherId : null,
		publisherName: extension.publisher,
		publisherDisplayName: extension.galleryInformation ? extension.galleryInformation.publisherDisplayName : null
	};
}

export function getOutdatedExtensions(accessor: ServicesAccessor): TPromise<IExtension[]> {
	const extensionsService = accessor.get(IExtensionsService);
	const galleryService = accessor.get(IGalleryService);

	if (!galleryService.isEnabled()) {
		return TPromise.as([]);
	}

	return extensionsService.getInstalled().then(installed => {
		const ids = installed.map(getExtensionId);

		return galleryService.query({ ids, pageSize: 1000 }).then(result => {
			const available = result.firstPage;

			return available.filter(extension => {
				const local = installed.filter(local => extensionEquals(local, extension))[0];
				return local && semver.lt(local.version, extension.version);
			});
		});
	});
}