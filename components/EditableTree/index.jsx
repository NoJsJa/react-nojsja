import React, { Component } from 'react';
import { toJS } from 'mobx';
import { Tree } from 'antd';
import PropTypes from 'prop-types';

import TreeNode from './TreeNode.jsx';
import TreeClass from './Tree';
import './index.less';

import { getRandomString, deepComparison } from 'utils/utils';

class EditableTree extends Component {
  state = {
    treeData: [],
    expandedKeys: [],
    focusKey: '',
  };
  maxLevel= 50
  dataOrigin = []
  treeModel = null
  key=getRandomString()

  componentDidMount() {
    const { data, maxLevel = 50 } = this.props;
    this.maxLevel = maxLevel;
    if (data) {
      this.dataOrigin = toJS(data);
      // 生成默认值
      TreeClass.defaultTreeValueWrapper(this.dataOrigin);
      TreeClass.levelDepthWrapper(this.dataOrigin);
      const formattedData = this.formatTreeData(this.dataOrigin);
      this.updateTreeModel();
      const keys = TreeClass.getTreeKeys(this.dataOrigin);
      this.onDataChange(this.dataOrigin);
      this.setState({
        treeData: formattedData,
        expandedKeys: keys,
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    let { data, maxLevel = 50 } = nextProps;
    this.maxLevel = maxLevel;
    data = toJS(data);
    try {
      if (
        !deepComparison(
          TreeClass.getNudeTreeData(JSON.parse(JSON.stringify(this.dataOrigin))),
          TreeClass.getNudeTreeData(JSON.parse(JSON.stringify(data)))
        )) {
        console.log('update', JSON.parse(JSON.stringify(data)));
        this.dataOrigin = data;
        // 生成默认值
        TreeClass.defaultTreeValueWrapper(this.dataOrigin);
        TreeClass.levelDepthWrapper(this.dataOrigin);
        const formattedData = this.formatTreeData(this.dataOrigin);
        this.updateTreeModel();
        const keys = TreeClass.getTreeKeys(this.dataOrigin);
        this.onDataChange(this.dataOrigin);
        this.setState({
          treeData: formattedData,
          expandedKeys: keys,
        });
      }
    } catch (error) {
      console.log(error, '----');
    }
  }

  /* 修改节点 */
  modifyNode = (key, treeNode) => {
    const modifiedData = this.treeModel.modifyNode(key, treeNode);
    console.log('modify node: ', this.dataOrigin);
    if (modifiedData) {
      this.setState({
        treeData: this.formatTreeData(modifiedData),
      }, () => this.onDataChange(this.dataOrigin));
    }
    return modifiedData;
  }

  /* 进入编辑模式 */
  getInToEditable = (key, treeNode) => {
    const modifiedData = this.treeModel.getInToEditable(key, treeNode);
    this.setState({
      treeData: this.formatTreeData(modifiedData),
    });
  }

  /* 添加一个兄弟节点 */
  addSisterNode = (key) => {
    const modifiedData = this.treeModel.addSisterNode(key);
    TreeClass.levelDepthWrapper(this.dataOrigin);
    this.setState({
      treeData: this.formatTreeData(modifiedData),
    }, () => this.onDataChange(this.dataOrigin));
  }

  /* 添加一个子结点 */
  addSubNode = (key, props) => {
    const modifiedData = this.treeModel.addSubNode(key, props);
    TreeClass.levelDepthWrapper(this.dataOrigin);
    this.setState({
      treeData: this.formatTreeData(modifiedData),
    }, this.onDataChange(this.dataOrigin));
  }

  /* 添加一个yaml节点片段 */
  addNodeFragment = (key, props) => {
    const modifiedData = this.treeModel.addNodeFragment(key, props);
    console.log(modifiedData);
    if (modifiedData) {
      TreeClass.levelDepthWrapper(this.dataOrigin);
      this.setState({
        treeData: this.formatTreeData(modifiedData),
      }, this.onDataChange(this.dataOrigin));
    }
    return modifiedData;
  }

  /* 移除一个节点 */
  removeNode = (key) => {
    const modifiedData = this.treeModel.removeNode(key);
    TreeClass.levelDepthWrapper(this.dataOrigin);
    this.setState({
      treeData: this.formatTreeData(modifiedData),
    }, this.onDataChange(this.dataOrigin));
  }

  /* 生成树节点数据 */
  formatNodeData = (treeData) => {
    let tree = {};
    const key = treeData.key || `${this.key}_${treeData.id}`;
    if (treeData.toString() === '[object Object]' && tree !== null) {
      tree.key = key;
      treeData.key = key;
      tree.title =
        (<TreeNode
          maxLevel={this.maxLevel}
          setParent={this.setAttr}
          focusKey={this.state.focusKey}
          treeData={treeData}
          modifyNode={this.modifyNode}
          addSisterNode={this.addSisterNode}
          addExpandedKey={this.addExpandedKey}
          getInToEditable={this.getInToEditable}
          addSubNode={this.addSubNode}
          addNodeFragment={this.addNodeFragment}
          removeNode={this.removeNode}
          setFocus={this.setFocus}
        />);
      if (treeData.nodeValue instanceof Array) tree.children = treeData.nodeValue.map(d => this.formatNodeData(d));
    } else {
      tree = '';
    }
    return tree;
  }

  /* 生成树数据 */
  formatTreeData = (treeData) => {
    let tree = [];
    if (treeData instanceof Array) {
      tree = treeData.map(treeNode => this.formatNodeData(treeNode));
    }
    return tree;
  }

  /* 更新TreeModel */
  updateTreeModel = () => {
    this.treeModel = new TreeClass(
      this.dataOrigin,
      this.key,
      {
        maxLevel: this.maxLevel,
        overLevelTips: this.props.pub.lang.template_tree_max_level_tips,
        completeEditingNodeTips: this.props.pub.lang.pleaseCompleteTheNodeBeingEdited,
        addSameLevelTips: this.props.pub.lang.extendedMetadata_same_level_name_cannot_be_added,
      }
    );
  }

  /* expand/unexpand */
  onExpand = (expandedKeys, { expanded: bool, node }) => {
    this.setState({
      expandedKeys,
    });
  }

  addExpandedKey = (key) => {
    key = key instanceof Array ? key : [key];
    this.setState({
      expandedKeys: Array.from(new Set([...this.state.expandedKeys, ...key])),
    });
  }

  /* 设置焦点 */
  setAttr = (key, value) => {
    this.setState({
      [key]: value,
    });
  }

  /* data change hook */
  onDataChange = (modifiedData) => {
    const { onDataChange = () => {} } = this.props;
    onDataChange(modifiedData);
  }


  render() {
    const { treeData } = this.state;
    return (
      <div
        className="editable-tree-wrapper"
      >{
        (treeData && treeData.length) ?
          <Tree
            showLine
            onExpand={this.onExpand}
            expandedKeys={this.state.expandedKeys}
            // defaultExpandedKeys={this.state.expandedKeys}
            defaultExpandAll
            treeData={treeData}
          />
        : null
      }
      </div>
    );
  }
}

EditableTree.propTypes = {
  data: PropTypes.array, // tree data
  onDataChange: PropTypes.func, // data change callback
};

export default EditableTree;
